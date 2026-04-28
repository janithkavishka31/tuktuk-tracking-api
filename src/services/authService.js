const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../config/prisma');

const ALLOWED_ROLES = ['ADMIN', 'POLICE'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

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
  };
}

function mapUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function registerUser({ fullName, email, password, role }) {
  if (!fullName || !email || !password || !role) {
    const error = new Error('fullName, email, password, and role are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRole(role);

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    const error = new Error('role must be ADMIN or POLICE');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: normalizedRole,
    },
  });

  const token = jwt.sign(buildTokenPayload(user), getJwtSecret(), {
    expiresIn: '7d',
  });

  return {
    user: mapUser(user),
    token,
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

  return {
    user: mapUser(user),
    token,
  };
}

module.exports = {
  loginUser,
  registerUser,
  mapUser,
};