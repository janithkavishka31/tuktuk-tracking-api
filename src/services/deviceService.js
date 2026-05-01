const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const prisma = require('../config/prisma');
const { tukTukWhereForUser, andWhere } = require('../utils/scope');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64url');
}

async function assertTukTukInUserScope(user, tuktukId) {
  const scope = tukTukWhereForUser(user);
  const where = andWhere(scope, { id: tuktukId });

  const tuk = await prisma.tukTuk.findFirst({ where });

  if (!tuk) {
    const error = new Error('TukTuk not found or outside your scope');
    error.statusCode = 404;
    throw error;
  }

  return tuk;
}

function formatApiKey(deviceId, secret) {
  return `${deviceId}.${secret}`;
}

async function createDevice(user, { tuktukId }) {
  if (!tuktukId) {
    const error = new Error('tuktukId is required');
    error.statusCode = 400;
    throw error;
  }

  await assertTukTukInUserScope(user, tuktukId);

  const secret = generateSecret();
  const apiKeyHash = await bcrypt.hash(secret, 10);

  const device = await prisma.device.create({
    data: {
      tuktukId,
      apiKeyHash,
    },
  });

  return {
    device: {
      id: device.id,
      tuktukId: device.tuktukId,
      createdAt: device.createdAt,
    },
    apiKey: formatApiKey(device.id, secret),
  };
}

async function rotateDeviceKey(user, deviceId) {
  if (!deviceId) {
    const error = new Error('device id is required');
    error.statusCode = 400;
    throw error;
  }

  const device = await prisma.device.findFirst({
    where: {
      id: deviceId,
      revokedAt: null,
    },
    include: { tuktuk: true },
  });

  if (!device) {
    const error = new Error('Device not found');
    error.statusCode = 404;
    throw error;
  }

  await assertTukTukInUserScope(user, device.tuktukId);

  const secret = generateSecret();
  const apiKeyHash = await bcrypt.hash(secret, 10);

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: {
      apiKeyHash,
      revokedAt: null,
    },
  });

  return {
    device: {
      id: updated.id,
      tuktukId: updated.tuktukId,
      updatedAt: updated.updatedAt,
    },
    apiKey: formatApiKey(updated.id, secret),
  };
}

async function revokeDevice(user, deviceId) {
  if (!deviceId) {
    const error = new Error('device id is required');
    error.statusCode = 400;
    throw error;
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    const error = new Error('Device not found');
    error.statusCode = 404;
    throw error;
  }

  await assertTukTukInUserScope(user, device.tuktukId);

  const updated = await prisma.device.update({
    where: { id: deviceId },
    data: { revokedAt: new Date() },
  });

  return {
    id: updated.id,
    tuktukId: updated.tuktukId,
    revokedAt: updated.revokedAt,
  };
}

module.exports = {
  createDevice,
  revokeDevice,
  rotateDeviceKey,
};
