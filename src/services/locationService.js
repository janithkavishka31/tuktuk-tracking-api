const prisma = require('../config/prisma');

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

async function getLastLocationForTukTuk(tuktukId) {
  if (!tuktukId) {
    const error = new Error('tuktukId is required');
    error.statusCode = 400;
    throw error;
  }

  const location = await prisma.location.findFirst({
    where: { tuktukId },
    orderBy: { createdAt: 'desc' },
  });

  if (!location) {
    const error = new Error('No location found for this TukTuk');
    error.statusCode = 404;
    throw error;
  }

  return mapLocation(location);
}

async function getLocationHistory({ tuktukId, hours = 24, skip = 0, take = 50 }) {
  if (!tuktukId) {
    const error = new Error('tuktukId is required');
    error.statusCode = 400;
    throw error;
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const locations = await prisma.location.findMany({
    where: {
      tuktukId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    skip: parseInt(skip),
    take: Math.min(parseInt(take), 500),
  });

  return locations.map(mapLocation);
}

async function getLiveLocations() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const lastLocations = await prisma.tukTuk.findMany({
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
  });

  return lastLocations
    .filter((t) => t.locations.length > 0)
    .map((tukTuk) => ({
      tuktukId: tukTuk.id,
      registrationNo: tukTuk.registrationNo,
      policeStation: tukTuk.policeStation,
      location: mapLocation(tukTuk.locations[0]),
    }));
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
