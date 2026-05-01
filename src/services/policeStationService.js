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

function listWhereForUser(user) {
  if (!user) {
    return { id: '__none__' };
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'PROVINCE_ADMIN':
      if (!user.provinceId) {
        return { id: '__none__' };
      }
      return { district: { provinceId: user.provinceId } };
    case 'DISTRICT_ADMIN':
      if (!user.districtId) {
        return { id: '__none__' };
      }
      return { districtId: user.districtId };
    case 'STATION_ADMIN':
      if (!user.stationId) {
        return { id: '__none__' };
      }
      return { id: user.stationId };
    case 'POLICE':
      if (user.stationId) {
        return { id: user.stationId };
      }
      if (user.districtId) {
        return { districtId: user.districtId };
      }
      if (user.provinceId) {
        return { district: { provinceId: user.provinceId } };
      }
      return { id: '__none__' };
    default:
      return { id: '__none__' };
  }
}

async function getPoliceStations(user) {
  const where = listWhereForUser(user);

  const stations = await prisma.policeStation.findMany({
    where,
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

  const station = await prisma.policeStation.findFirst({
    where: {
      id,
      ...listWhereForUser(user),
    },
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

async function updatePoliceStation(id, payload) {
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
  createPoliceStation,
  deletePoliceStation,
  getPoliceStationById,
  getPoliceStations,
  updatePoliceStation,
};
