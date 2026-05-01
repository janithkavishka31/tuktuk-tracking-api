const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../config/prisma');
const { mapPublicUser, normalizeEmail } = require('./userService');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  return secret;
}

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    provinceId: user.provinceId || null,
    districtId: user.districtId || null,
    stationId: user.stationId || null,
  };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    const error = new Error('email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      provinceId: true,
      districtId: true,
      stationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(buildTokenPayload(user), getJwtSecret(), {
    expiresIn: '7d',
  });

  const { password: _pw, ...safe } = user;

  return {
    user: mapPublicUser(safe),
    token,
  };
}

module.exports = {
  buildTokenPayload,
  loginUser,
  mapPublicUser,
};
