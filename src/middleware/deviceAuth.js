const bcrypt = require('bcryptjs');

const prisma = require('../config/prisma');

function splitApiKey(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const trimmed = headerValue.trim();
  const dot = trimmed.indexOf('.');

  if (dot <= 0 || dot === trimmed.length - 1) {
    return null;
  }

  return {
    deviceId: trimmed.slice(0, dot),
    secret: trimmed.slice(dot + 1),
  };
}

async function authenticateDevice(req, res, next) {
  const rawKey = req.headers['x-api-key'];

  if (!rawKey) {
    return res.status(401).json({ message: 'x-api-key header is required' });
  }

  const parts = splitApiKey(rawKey);

  if (!parts) {
    return res.status(401).json({ message: 'Invalid API key format' });
  }

  const device = await prisma.device.findFirst({
    where: {
      id: parts.deviceId,
      revokedAt: null,
    },
    include: {
      tuktuk: {
        select: { id: true },
      },
    },
  });

  if (!device) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  const matches = await bcrypt.compare(parts.secret, device.apiKeyHash);

  if (!matches) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  req.device = device;
  req.authContext = { type: 'device' };

  return next();
}

module.exports = {
  authenticateDevice,
  splitApiKey,
};
