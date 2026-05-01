const bcrypt = require('bcryptjs');

const prisma = require('../config/prisma');
const { CREATE_RULES } = require('../constants/roles');

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toUpperCase();
}

function countScopes(body) {
  const hasStation = Boolean(body.stationId);
  const hasDistrict = Boolean(body.districtId);
  const hasProvince = Boolean(body.provinceId);
  return [hasStation, hasDistrict, hasProvince].filter(Boolean).length;
}

function assertCreatorCanCreateRole(creatorRole, targetRole) {
  const allowed = CREATE_RULES[creatorRole] || [];

  if (!allowed.includes(targetRole)) {
    const error = new Error('You are not allowed to create users with this role');
    error.statusCode = 403;
    throw error;
  }
}

async function assertStationInCreatorScope(creator, stationId) {
  const station = await prisma.policeStation.findUnique({
    where: { id: stationId },
    include: { district: true },
  });

  if (!station) {
    const error = new Error('Police station not found');
    error.statusCode = 404;
    throw error;
  }

  if (creator.role === 'SUPER_ADMIN') {
    return station;
  }

  if (creator.role === 'PROVINCE_ADMIN') {
    if (!creator.provinceId || station.district.provinceId !== creator.provinceId) {
      const error = new Error('Station is outside your province scope');
      error.statusCode = 403;
      throw error;
    }
    return station;
  }

  if (creator.role === 'DISTRICT_ADMIN') {
    if (!creator.districtId || station.districtId !== creator.districtId) {
      const error = new Error('Station is outside your district scope');
      error.statusCode = 403;
      throw error;
    }
    return station;
  }

  if (creator.role === 'STATION_ADMIN') {
    if (!creator.stationId || station.id !== creator.stationId) {
      const error = new Error('Station is outside your station scope');
      error.statusCode = 403;
      throw error;
    }
    return station;
  }

  const error = new Error('Forbidden');
  error.statusCode = 403;
  throw error;
}

async function assertDistrictInCreatorScope(creator, districtId) {
  const district = await prisma.district.findUnique({
    where: { id: districtId },
  });

  if (!district) {
    const error = new Error('District not found');
    error.statusCode = 404;
    throw error;
  }

  if (creator.role === 'SUPER_ADMIN') {
    return district;
  }

  if (creator.role === 'PROVINCE_ADMIN') {
    if (!creator.provinceId || district.provinceId !== creator.provinceId) {
      const error = new Error('District is outside your province scope');
      error.statusCode = 403;
      throw error;
    }
    return district;
  }

  if (creator.role === 'DISTRICT_ADMIN') {
    if (!creator.districtId || district.id !== creator.districtId) {
      const error = new Error('District is outside your district scope');
      error.statusCode = 403;
      throw error;
    }
    return district;
  }

  const error = new Error('Forbidden');
  error.statusCode = 403;
  throw error;
}

async function assertProvinceInCreatorScope(creator, provinceId) {
  const province = await prisma.province.findUnique({
    where: { id: provinceId },
  });

  if (!province) {
    const error = new Error('Province not found');
    error.statusCode = 404;
    throw error;
  }

  if (creator.role === 'SUPER_ADMIN') {
    return province;
  }

  if (creator.role === 'PROVINCE_ADMIN') {
    if (!creator.provinceId || province.id !== creator.provinceId) {
      const error = new Error('Province is outside your scope');
      error.statusCode = 403;
      throw error;
    }
    return province;
  }

  const error = new Error('Forbidden');
  error.statusCode = 403;
  throw error;
}

function validateAdminScopeFields(role, body) {
  if (role === 'PROVINCE_ADMIN') {
    if (!body.provinceId) {
      const error = new Error('provinceId is required for PROVINCE_ADMIN');
      error.statusCode = 400;
      throw error;
    }
    if (body.districtId || body.stationId) {
      const error = new Error('PROVINCE_ADMIN must only have provinceId set');
      error.statusCode = 400;
      throw error;
    }
  }

  if (role === 'DISTRICT_ADMIN') {
    if (!body.districtId) {
      const error = new Error('districtId is required for DISTRICT_ADMIN');
      error.statusCode = 400;
      throw error;
    }
    if (body.provinceId || body.stationId) {
      const error = new Error('DISTRICT_ADMIN must only have districtId set');
      error.statusCode = 400;
      throw error;
    }
  }

  if (role === 'STATION_ADMIN') {
    if (!body.stationId) {
      const error = new Error('stationId is required for STATION_ADMIN');
      error.statusCode = 400;
      throw error;
    }
    if (body.provinceId || body.districtId) {
      const error = new Error('STATION_ADMIN must only have stationId set');
      error.statusCode = 400;
      throw error;
    }
  }
}

async function validateNewUserAgainstCreator(creator, targetRole, body) {
  if (targetRole === 'SUPER_ADMIN') {
    const error = new Error('Cannot create SUPER_ADMIN via API');
    error.statusCode = 403;
    throw error;
  }

  assertCreatorCanCreateRole(creator.role, targetRole);

  if (targetRole === 'PROVINCE_ADMIN') {
    validateAdminScopeFields('PROVINCE_ADMIN', body);
    await assertProvinceInCreatorScope(creator, body.provinceId);
    return {
      provinceId: body.provinceId,
      districtId: null,
      stationId: null,
    };
  }

  if (targetRole === 'DISTRICT_ADMIN') {
    validateAdminScopeFields('DISTRICT_ADMIN', body);
    await assertDistrictInCreatorScope(creator, body.districtId);
    return {
      provinceId: null,
      districtId: body.districtId,
      stationId: null,
    };
  }

  if (targetRole === 'STATION_ADMIN') {
    validateAdminScopeFields('STATION_ADMIN', body);
    await assertStationInCreatorScope(creator, body.stationId);
    return {
      provinceId: null,
      districtId: null,
      stationId: body.stationId,
    };
  }

  if (targetRole === 'POLICE') {
    const scopeCount = countScopes(body);

    if (scopeCount !== 1) {
      const error = new Error(
        'POLICE users require exactly one of stationId, districtId, or provinceId',
      );
      error.statusCode = 400;
      throw error;
    }

    if (body.stationId) {
      await assertStationInCreatorScope(creator, body.stationId);
      return {
        provinceId: null,
        districtId: null,
        stationId: body.stationId,
      };
    }

    if (body.districtId) {
      await assertDistrictInCreatorScope(creator, body.districtId);
      return {
        provinceId: null,
        districtId: body.districtId,
        stationId: null,
      };
    }

    await assertProvinceInCreatorScope(creator, body.provinceId);
    return {
      provinceId: body.provinceId,
      districtId: null,
      stationId: null,
    };
  }

  const error = new Error('Unsupported role');
  error.statusCode = 400;
  throw error;
}

function mapPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    provinceId: user.provinceId,
    districtId: user.districtId,
    stationId: user.stationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createUser(creator, payload) {
  const { name, email, password, role } = payload;

  if (!name || !email || !password || !role) {
    const error = new Error('name, email, password, and role are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRole(role);

  const scope = await validateNewUserAgainstCreator(creator, normalizedRole, payload);

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
      name: String(name).trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: normalizedRole,
      provinceId: scope.provinceId,
      districtId: scope.districtId,
      stationId: scope.stationId,
    },
  });

  return { user: mapPublicUser(user) };
}

module.exports = {
  createUser,
  mapPublicUser,
  normalizeEmail,
  normalizeRole,
};
