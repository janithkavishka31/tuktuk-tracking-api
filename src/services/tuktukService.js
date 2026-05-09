const prisma = require('../config/prisma');
const { andWhere, tukTukWhereForUser } = require('../utils/scope');

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function assertTukTukInScope(user, id) {
  const scope = tukTukWhereForUser(user);
  const tuk = await prisma.tukTuk.findFirst({
    where: andWhere(scope, { id }),
    include: {
      policeStation: {
        include: {
          district: {
            include: {
              province: true,
            },
          },
        },
      },
      locations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!tuk) {
    const error = new Error('TukTuk not found');
    error.statusCode = 404;
    throw error;
  }

  return tuk;
}

function scopedPoliceStationFilter(user) {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'PROVINCE_ADMIN':
      return { district: { provinceId: user.provinceId } };
    case 'DISTRICT_ADMIN':
      return { districtId: user.districtId };
    case 'STATION_ADMIN':
      return { id: user.stationId };
    default:
      return { id: '__none__' };
  }
}

async function findPoliceStationInScope(user, policeStationId) {
  return prisma.policeStation.findFirst({
    where: {
      id: policeStationId,
      ...scopedPoliceStationFilter(user),
    },
  });
}

async function createTukTuk(user, { registrationNo, policeStationId }) {
  if (!registrationNo || !policeStationId) {
    const error = new Error('registrationNo and policeStationId are required');
    error.statusCode = 400;
    throw error;
  }

  const stationInScope = await findPoliceStationInScope(user, policeStationId);

  if (!stationInScope) {
    const error = new Error('Police station not found or outside your scope');
    error.statusCode = 404;
    throw error;
  }

  const existingTukTuk = await prisma.tukTuk.findUnique({
    where: { registrationNo: String(registrationNo).trim().toUpperCase() },
  });

  if (existingTukTuk) {
    const error = new Error('TukTuk with this registration number already exists');
    error.statusCode = 409;
    throw error;
  }

  const tukTuk = await prisma.tukTuk.create({
    data: {
      registrationNo: String(registrationNo).trim().toUpperCase(),
      policeStationId,
    },
    include: {
      policeStation: {
        include: {
          district: {
            include: {
              province: true,
            },
          },
        },
      },
    },
  });

  return mapTukTuk({ ...tukTuk, locations: [] });
}

async function getAllTukTuks(user, { page = 1, limit = 20 } = {}) {
  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
  const skip = (currentPage - 1) * pageSize;
  const where = tukTukWhereForUser(user);

  const [total, tuktuks] = await Promise.all([
    prisma.tukTuk.count({ where }),
    prisma.tukTuk.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        policeStation: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
        locations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    data: tuktuks.map(mapTukTuk),
    meta: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

async function getFilteredTukTuks(
  user,
  {
    provinceId,
    districtId,
    policeStationId,
    page = 1,
    limit = 20,
  } = {},
) {
  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
  const skip = (currentPage - 1) * pageSize;

  if (user.role === 'PROVINCE_ADMIN' && provinceId && provinceId !== user.provinceId) {
    const error = new Error('Forbidden: provinceId is outside your scope');
    error.statusCode = 403;
    throw error;
  }

  if (user.role === 'PROVINCE_ADMIN' && districtId) {
    const district = await prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district) {
      const error = new Error('District not found');
      error.statusCode = 404;
      throw error;
    }
    if (district.provinceId !== user.provinceId) {
      const error = new Error('Forbidden: districtId is outside your province scope');
      error.statusCode = 403;
      throw error;
    }
  }

  if (user.role === 'DISTRICT_ADMIN' && districtId && districtId !== user.districtId) {
    const error = new Error('Forbidden: districtId is outside your scope');
    error.statusCode = 403;
    throw error;
  }

  if (policeStationId) {
    const station = await findPoliceStationInScope(user, policeStationId);
    if (!station) {
      const error = new Error('Police station not found or outside your scope');
      error.statusCode = 404;
      throw error;
    }
  }

  const extraWhere = {};

  if (policeStationId) {
    extraWhere.policeStationId = policeStationId;
  }

  if (districtId) {
    extraWhere.policeStation = {
      ...(extraWhere.policeStation || {}),
      districtId,
    };
  }

  if (provinceId) {
    extraWhere.policeStation = {
      ...(extraWhere.policeStation || {}),
      district: {
        ...(extraWhere.policeStation?.district || {}),
        provinceId,
      },
    };
  }

  const scopeWhere = tukTukWhereForUser(user);
  const where = andWhere(scopeWhere, extraWhere);

  const [total, tuktuks] = await Promise.all([
    prisma.tukTuk.count({ where }),
    prisma.tukTuk.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        policeStation: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
        locations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    data: tuktuks.map(mapTukTuk),
    meta: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      filters: {
        provinceId: provinceId || null,
        districtId: districtId || null,
        policeStationId: policeStationId || null,
      },
    },
  };
}

async function getTukTukById(user, id) {
  const tukTuk = await assertTukTukInScope(user, id);
  return mapTukTuk(tukTuk);
}

async function updateTukTuk(user, id, { registrationNo, policeStationId }) {
  const existing = await assertTukTukInScope(user, id);

  if (policeStationId && policeStationId !== existing.policeStationId) {
    const stationInScope = await findPoliceStationInScope(user, policeStationId);

    if (!stationInScope) {
      const error = new Error('Police station not found or outside your scope');
      error.statusCode = 404;
      throw error;
    }
  }

  const data = {};

  if (registrationNo !== undefined) {
    const normalized = String(registrationNo).trim().toUpperCase();

    if (normalized !== existing.registrationNo) {
      const clash = await prisma.tukTuk.findUnique({
        where: { registrationNo: normalized },
      });

      if (clash) {
        const error = new Error('TukTuk with this registration number already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    data.registrationNo = normalized;
  }

  if (policeStationId !== undefined) {
    data.policeStationId = policeStationId;
  }

  if (!Object.keys(data).length) {
    const error = new Error('No updatable fields provided');
    error.statusCode = 400;
    throw error;
  }

  const tukTuk = await prisma.tukTuk.update({
    where: { id },
    data,
    include: {
      policeStation: {
        include: {
          district: {
            include: {
              province: true,
            },
          },
        },
      },
      locations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return mapTukTuk(tukTuk);
}

async function deleteTukTuk(user, id) {
  await assertTukTukInScope(user, id);
  await prisma.tukTuk.delete({ where: { id } });
  return { id };
}

function mapTukTuk(tukTuk) {
  const lastLocation = tukTuk.locations?.[0] || null;

  return {
    id: tukTuk.id,
    registrationNo: tukTuk.registrationNo,
    policeStation: tukTuk.policeStation
      ? {
          id: tukTuk.policeStation.id,
          name: tukTuk.policeStation.name,
          district: tukTuk.policeStation.district
            ? {
                id: tukTuk.policeStation.district.id,
                name: tukTuk.policeStation.district.name,
                province: tukTuk.policeStation.district.province
                  ? {
                      id: tukTuk.policeStation.district.province.id,
                      name: tukTuk.policeStation.district.province.name,
                    }
                  : null,
              }
            : null,
        }
      : null,
    lastLocation: lastLocation
      ? {
          id: lastLocation.id,
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          speed: lastLocation.speed,
          heading: lastLocation.heading,
          accuracy: lastLocation.accuracy,
          altitude: lastLocation.altitude,
          timestamp: lastLocation.createdAt,
        }
      : null,
    createdAt: tukTuk.createdAt,
    updatedAt: tukTuk.updatedAt,
  };
}

module.exports = {
  createTukTuk,
  deleteTukTuk,
  getAllTukTuks,
  getFilteredTukTuks,
  getTukTukById,
  mapTukTuk,
  updateTukTuk,
};
