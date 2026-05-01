const prisma = require('../config/prisma');

function mapPoliceStation(station) {
  return {
    id: station.id,
    name: station.name,
    district: station.district
      ? {
          id: station.district.id,
          name: station.district.name,
          province: station.district.province
            ? {
                id: station.district.province.id,
                name: station.district.province.name,
              }
            : null,
        }
      : null,
    createdAt: station.createdAt,
    updatedAt: station.updatedAt,
  };
}

async function getScopedPoliceStationIdForUser(user) {
  if (!user || user.role !== 'POLICE') {
    return null;
  }

  if (user.policeStationId) {
    return user.policeStationId;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { policeStationId: true },
  });

  if (!dbUser || !dbUser.policeStationId) {
    const error = new Error('Police user is not assigned to a station');
    error.statusCode = 403;
    throw error;
  }

  return dbUser.policeStationId;
}

async function getPoliceStations(user) {
  const scopedStationId = await getScopedPoliceStationIdForUser(user);

  const stations = await prisma.policeStation.findMany({
    where: scopedStationId ? { id: scopedStationId } : undefined,
    include: {
      district: {
        include: {
          province: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return stations.map(mapPoliceStation);
}

async function getPoliceStationById(id, user) {
  if (!id) {
    const error = new Error('Police station id is required');
    error.statusCode = 400;
    throw error;
  }

  const scopedStationId = await getScopedPoliceStationIdForUser(user);

  if (scopedStationId && scopedStationId !== id) {
    const error = new Error('Forbidden: POLICE can only access their own station');
    error.statusCode = 403;
    throw error;
  }

  const station = await prisma.policeStation.findUnique({
    where: { id },
    include: {
      district: {
        include: {
          province: true,
        },
      },
    },
  });

  if (!station) {
    const error = new Error('Police station not found');
    error.statusCode = 404;
    throw error;
  }

  return mapPoliceStation(station);
}

async function createPoliceStation({ name, districtId }) {
  if (!name || !districtId) {
    const error = new Error('name and districtId are required');
    error.statusCode = 400;
    throw error;
  }

  const district = await prisma.district.findUnique({ where: { id: districtId } });

  if (!district) {
    const error = new Error('District not found');
    error.statusCode = 404;
    throw error;
  }

  const station = await prisma.policeStation.create({
    data: {
      name: String(name).trim(),
      districtId,
    },
    include: {
      district: {
        include: {
          province: true,
        },
      },
    },
  });

  return mapPoliceStation(station);
}

async function updatePoliceStation(id, payload, user) {
  if (!id) {
    const error = new Error('Police station id is required');
    error.statusCode = 400;
    throw error;
  }

  const scopedStationId = await getScopedPoliceStationIdForUser(user);

  if (scopedStationId && scopedStationId !== id) {
    const error = new Error('Forbidden: POLICE can only update their own station');
    error.statusCode = 403;
    throw error;
  }

  const station = await prisma.policeStation.findUnique({ where: { id } });

  if (!station) {
    const error = new Error('Police station not found');
    error.statusCode = 404;
    throw error;
  }

  const data = {};

  if (payload.name !== undefined) {
    data.name = String(payload.name).trim();
  }

  if (payload.districtId !== undefined) {
    const district = await prisma.district.findUnique({ where: { id: payload.districtId } });

    if (!district) {
      const error = new Error('District not found');
      error.statusCode = 404;
      throw error;
    }

    data.districtId = payload.districtId;
  }

  const updated = await prisma.policeStation.update({
    where: { id },
    data,
    include: {
      district: {
        include: {
          province: true,
        },
      },
    },
  });

  return mapPoliceStation(updated);
}

async function deletePoliceStation(id) {
  if (!id) {
    const error = new Error('Police station id is required');
    error.statusCode = 400;
    throw error;
  }

  const station = await prisma.policeStation.findUnique({ where: { id } });

  if (!station) {
    const error = new Error('Police station not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.policeStation.delete({ where: { id } });

  return { id };
}

module.exports = {
  getPoliceStations,
  getPoliceStationById,
  createPoliceStation,
  updatePoliceStation,
  deletePoliceStation,
};
