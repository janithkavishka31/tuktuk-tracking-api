const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const provinces = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
];

const districtSeeds = [
  { name: 'Colombo', province: 'Western', lat: 6.9271, lng: 79.8612 },
  { name: 'Gampaha', province: 'Western', lat: 7.0873, lng: 80.0144 },
  { name: 'Kalutara', province: 'Western', lat: 6.5854, lng: 79.9607 },
  { name: 'Kandy', province: 'Central', lat: 7.2906, lng: 80.6337 },
  { name: 'Matale', province: 'Central', lat: 7.4675, lng: 80.6234 },
  { name: 'Nuwara Eliya', province: 'Central', lat: 6.9497, lng: 80.7891 },
  { name: 'Galle', province: 'Southern', lat: 6.0535, lng: 80.221 },
  { name: 'Matara', province: 'Southern', lat: 5.9485, lng: 80.5353 },
  { name: 'Hambantota', province: 'Southern', lat: 6.1246, lng: 81.1185 },
  { name: 'Jaffna', province: 'Northern', lat: 9.6615, lng: 80.0255 },
  { name: 'Kilinochchi', province: 'Northern', lat: 9.3961, lng: 80.3982 },
  { name: 'Mannar', province: 'Northern', lat: 8.981, lng: 79.9047 },
  { name: 'Vavuniya', province: 'Northern', lat: 8.7514, lng: 80.4977 },
  { name: 'Mullaitivu', province: 'Northern', lat: 9.2671, lng: 80.8167 },
  { name: 'Batticaloa', province: 'Eastern', lat: 7.717, lng: 81.7 },
  { name: 'Ampara', province: 'Eastern', lat: 7.2965, lng: 81.6747 },
  { name: 'Trincomalee', province: 'Eastern', lat: 8.5874, lng: 81.2152 },
  { name: 'Kurunegala', province: 'North Western', lat: 7.4863, lng: 80.3647 },
  { name: 'Puttalam', province: 'North Western', lat: 8.0362, lng: 79.8283 },
  { name: 'Anuradhapura', province: 'North Central', lat: 8.3114, lng: 80.4037 },
  { name: 'Polonnaruwa', province: 'North Central', lat: 7.9403, lng: 81.0188 },
  { name: 'Badulla', province: 'Uva', lat: 6.9934, lng: 81.055 },
  { name: 'Monaragala', province: 'Uva', lat: 6.8712, lng: 81.3498 },
  { name: 'Kegalle', province: 'Sabaragamuwa', lat: 7.2513, lng: 80.3464 },
  { name: 'Ratnapura', province: 'Sabaragamuwa', lat: 6.6828, lng: 80.3992 },
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function formatRegistrationNo(index) {
  return `TUK-${String(index + 1).padStart(4, '0')}`;
}

async function main() {
  await prisma.location.deleteMany();
  await prisma.tukTuk.deleteMany();
  await prisma.policeStation.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();
  await prisma.user.deleteMany();

  const provinceRecords = await Promise.all(
    provinces.map((name) => prisma.province.create({ data: { name } })),
  );

  const provinceMap = Object.fromEntries(
    provinceRecords.map((province) => [province.name, province]),
  );

  const districtRecords = [];

  for (const districtSeed of districtSeeds) {
    const district = await prisma.district.create({
      data: {
        name: districtSeed.name,
        provinceId: provinceMap[districtSeed.province].id,
      },
    });

    districtRecords.push({ ...district, ...districtSeed });
  }

  const stationSeeds = districtRecords.slice(0, 20).map((district, index) => ({
    name: `${district.name} Police Station`,
    districtId: district.id,
    districtLat: district.lat,
    districtLng: district.lng,
    provinceName: district.province,
    order: index,
  }));

  const stationRecords = [];

  for (const stationSeed of stationSeeds) {
    const station = await prisma.policeStation.create({
      data: {
        name: stationSeed.name,
        districtId: stationSeed.districtId,
      },
      include: {
        district: {
          include: { province: true },
        },
      },
    });

    stationRecords.push({
      ...station,
      districtLat: stationSeed.districtLat,
      districtLng: stationSeed.districtLng,
    });
  }

  const demoUsers = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'System Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('Admin@123', 10),
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Police Officer',
        email: 'police@example.com',
        password: await bcrypt.hash('Police@123', 10),
        role: 'POLICE',
        policeStationId: stationRecords[0]?.id,
      },
    }),
  ]);

  const tuktukRecords = [];

  for (let index = 0; index < 200; index += 1) {
    const station = stationRecords[index % stationRecords.length];
    const tukTuk = await prisma.tukTuk.create({
      data: {
        registrationNo: formatRegistrationNo(index),
        policeStationId: station.id,
      },
      include: {
        policeStation: {
          include: {
            district: {
              include: { province: true },
            },
          },
        },
      },
    });

    tuktukRecords.push({ ...tukTuk, station });
  }

  const now = new Date();

  for (const [index, tukTuk] of tuktukRecords.entries()) {
    const baseLat = tukTuk.station.districtLat;
    const baseLng = tukTuk.station.districtLng;

    for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - dayOffset);
      day.setHours(8 + (index % 8), 0, 0, 0);

      await prisma.location.create({
        data: {
          tuktukId: tukTuk.id,
          latitude: baseLat + dayOffset * 0.01 + randomBetween(-0.005, 0.005),
          longitude: baseLng + dayOffset * 0.01 + randomBetween(-0.005, 0.005),
          speed: randomBetween(10, 45),
          heading: randomBetween(0, 359),
          accuracy: randomBetween(3, 12),
          altitude: randomBetween(5, 80),
          createdAt: day,
        },
      });
    }
  }

  console.log('Seed completed successfully');
  console.log({
    provinces: provinceRecords.length,
    districts: districtRecords.length,
    policeStations: stationRecords.length,
    users: demoUsers.length,
    tuktuks: tuktukRecords.length,
    locations: tuktukRecords.length * 7,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
