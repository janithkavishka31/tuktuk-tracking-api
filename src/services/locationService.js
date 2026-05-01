const prisma = require('../config/prisma');
const { andWhere, tukTukWhereForUser } = require('../utils/scope');

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDate(value, label) {
  if (!value) {
    return null;
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    const error = new Error(`${label} must be a valid ISO date`);
    error.statusCode = 400;
    throw error;
  }

  return d;
}

function buildHistoryWhere({ scope, tuktukId, from, to }) {
  const tuktukFilter = {};

  if (tuktukId) {
    tuktukFilter.tuktukId = tuktukId;
  }

  const timeFilter = {};

  if (from || to) {
    timeFilter.createdAt = {};

    if (from) {
      timeFilter.createdAt.gte = from;
    }

    if (to) {
      timeFilter.createdAt.lte = to;
    }
  }

  const tuktukScope = scope && Object.keys(scope).length ? { tuktuk: scope } : {};

  return andWhere(tuktukScope, {
    ...tuktukFilter,
    ...timeFilter,
  });
}

async function addLocationForDevice(device, body) {
  const {
    tuktukId,
    latitude,
    longitude,
    speed = 0,
    heading = 0,
    accuracy = 0,
    altitude = 0,
  } = body;

  if (!tuktukId || latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    const error = new Error('tuktukId, latitude, and longitude are required');
    error.statusCode = 400;
    throw error;
  }

  if (tuktukId !== device.tuktukId) {
    const error = new Error('tuktukId does not match this device');
    error.statusCode = 403;
    throw error;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    const error = new Error(
      'Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180',
    );
    error.statusCode = 400;
    throw error;
  }

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

async function getLiveLocations({ user, scope: scopeOverride, page = 1, limit = 20, tuktukId } = {}) {
  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
  const skip = (currentPage - 1) * pageSize;

  const scope = scopeOverride ?? tukTukWhereForUser(user);
  const where = andWhere(scope, tuktukId ? { id: tuktukId } : {});

  const [total, tuktuks] = await Promise.all([
    prisma.tukTuk.count({ where }),
    prisma.tukTuk.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
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
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  return {
    data: tuktuks.map((tukTuk) => ({
      tuktukId: tukTuk.id,
      registrationNo: tukTuk.registrationNo,
      policeStation: tukTuk.policeStation,
      location: tukTuk.locations[0] ? mapLocation(tukTuk.locations[0]) : null,
    })),
    meta: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

async function getLocationHistory({
  user,
  scope: scopeOverride,
  tuktukId,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  let fromDate = from ? parseDate(from, 'from') : null;
  let toDate = to ? parseDate(to, 'to') : null;

  if (!fromDate && !toDate) {
    toDate = new Date();
    fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (fromDate && toDate && fromDate > toDate) {
    const error = new Error('from must be before or equal to to');
    error.statusCode = 400;
    throw error;
  }

  const effectiveScope = scopeOverride ?? tukTukWhereForUser(user);

  if (tuktukId) {
    const allowed = await prisma.tukTuk.findFirst({
      where: andWhere(effectiveScope, { id: tuktukId }),
      select: { id: true },
    });

    if (!allowed) {
      const error = new Error('TukTuk not found or outside your scope');
      error.statusCode = 404;
      throw error;
    }
  }

  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), 500);
  const skip = (currentPage - 1) * pageSize;

  const where = buildHistoryWhere({
    scope: effectiveScope,
    tuktukId,
    from: fromDate,
    to: toDate,
  });

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
      filters: {
        tuktukId: tuktukId || null,
        from: fromDate ? fromDate.toISOString() : null,
        to: toDate ? toDate.toISOString() : null,
      },
    },
  };
}

function mapLocation(location) {
  if (!location) {
    return null;
  }

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
  addLocationForDevice,
  getLiveLocations,
  getLocationHistory,
  mapLocation,
};
