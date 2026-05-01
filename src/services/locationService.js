const prisma = require('../config/prisma');

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildLocationFilter({ tuktukId, provinceId, districtId, hours }) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const where = {
    createdAt: { gte: since },
  };

  if (tuktukId) {
    where.tuktukId = tuktukId;
  }

  if (provinceId || districtId) {
    where.tuktuk = {
      policeStation: {
        ...(provinceId ? { district: { provinceId } } : {}),
        ...(districtId ? { districtId } : {}),
      },
    };
  }

  return { where, since };
}

async function addLocation({ tuktukId, latitude, longitude, speed = 0, heading = 0, accuracy = 0, altitude = 0 }) {
  if (!tuktukId || latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    const error = new Error('tuktukId, latitude, and longitude are required');
    error.statusCode = 400;
    throw error;
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    const error = new Error('Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180');
    error.statusCode = 400;
    throw error;
  }

  // Check if TukTuk exists
  const tukTuk = await prisma.tukTuk.findUnique({
    where: { id: tuktukId },
  });

  if (!tukTuk) {
    const error = new Error('TukTuk not found');
    error.statusCode = 404;
    throw error;
  }

  const location = await prisma.location.create({
    data: {
      tuktukId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed) || 0,
      heading: parseFloat(heading) || 0,
      accuracy: parseFloat(accuracy) || 0,
      altitude: parseFloat(altitude) || 0,
    },
  });

  return mapLocation(location);
}

async function getLastLocationForTukTuk({ tuktukId, provinceId, districtId }) {
  if (!tuktukId && !provinceId && !districtId) {
    const error = new Error('tuktukId is required');
    error.statusCode = 400;
    throw error;
  }

  const location = await prisma.location.findFirst({
    where: {
      ...(tuktukId ? { tuktukId } : {}),
      ...(provinceId || districtId
        ? {
            tuktuk: {
              policeStation: {
                ...(provinceId ? { district: { provinceId } } : {}),
                ...(districtId ? { districtId } : {}),
              },
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!location) {
    const error = new Error('No location found for this TukTuk');
    error.statusCode = 404;
    throw error;
  }

  return mapLocation(location);
}

async function getLocationHistory({ tuktukId, provinceId, districtId, hours = 24, page = 1, limit = 20 }) {
  if (!tuktukId && !provinceId && !districtId) {
    const error = new Error('tuktukId, provinceId, or districtId is required');
    error.statusCode = 400;
    throw error;
  }

  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 500);
  const skip = (currentPage - 1) * pageSize;
  const { where } = buildLocationFilter({ tuktukId, provinceId, districtId, hours });

  const [total, locations] = await Promise.all([
    prisma.location.count({ where }),
    prisma.location.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: locations.map(mapLocation),
    meta: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      hours,
    },
  };
}

async function getLiveLocations({ provinceId, districtId, page = 1, limit = 20 } = {}) {
  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
  const skip = (currentPage - 1) * pageSize;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where = {
    ...(provinceId || districtId
      ? {
          policeStation: {
            ...(provinceId ? { district: { provinceId } } : {}),
            ...(districtId ? { districtId } : {}),
          },
        }
      : {}),
    locations: {
      some: {
        createdAt: { gte: oneDayAgo },
      },
    },
  };

  const [total, lastLocations] = await Promise.all([
    prisma.tukTuk.count({ where }),
    prisma.tukTuk.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        registrationNo: true,
        policeStation: {
          select: {
            id: true,
            name: true,
            district: {
              select: {
                id: true,
                name: true,
                province: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        locations: {
          where: {
            createdAt: { gte: oneDayAgo },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  return {
    data: lastLocations.map((tukTuk) => ({
      tuktukId: tukTuk.id,
      registrationNo: tukTuk.registrationNo,
      policeStation: tukTuk.policeStation,
      location: mapLocation(tukTuk.locations[0]),
    })),
    meta: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

function mapLocation(location) {
  return {
    id: location.id,
    tuktukId: location.tuktukId,
    latitude: location.latitude,
    longitude: location.longitude,
    speed: location.speed,
    heading: location.heading,
    accuracy: location.accuracy,
    altitude: location.altitude,
    timestamp: location.createdAt,
  };
}

module.exports = {
  addLocation,
  getLastLocationForTukTuk,
  getLocationHistory,
  getLiveLocations,
  mapLocation,
};
