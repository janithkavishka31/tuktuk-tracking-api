const prisma = require('../config/prisma');

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildTrackingFilter({ provinceId, districtId }) {
  const where = {};

  if (provinceId) {
    where.policeStation = {
      district: {
        provinceId,
      },
    };
  }

  if (districtId) {
    where.policeStation = {
      ...(where.policeStation || {}),
      districtId,
    };
  }

  return where;
}

async function createTukTuk({ registrationNo, policeStationId }) {
  if (!registrationNo || !policeStationId) {
    const error = new Error('registrationNo and policeStationId are required');
    error.statusCode = 400;
    throw error;
  }

  // Check if police station exists
  const policeStation = await prisma.policeStation.findUnique({
    where: { id: policeStationId },
  });

  if (!policeStation) {
    const error = new Error('Police station not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if registration number already exists
  const existingTukTuk = await prisma.tukTuk.findUnique({
    where: { registrationNo },
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

  return mapTukTuk(tukTuk);
}

async function getAllTukTuks({ page = 1, limit = 20, provinceId, districtId } = {}) {
  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
  const skip = (currentPage - 1) * pageSize;
  const where = buildTrackingFilter({ provinceId, districtId });

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

async function getTukTukById(id) {
  if (!id) {
    const error = new Error('TukTuk ID is required');
    error.statusCode = 400;
    throw error;
  }

  const tukTuk = await prisma.tukTuk.findUnique({
    where: { id },
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

  if (!tukTuk) {
    const error = new Error('TukTuk not found');
    error.statusCode = 404;
    throw error;
  }

  return mapTukTuk(tukTuk);
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
  getAllTukTuks,
  getTukTukById,
  mapTukTuk,
};
