-- AlterTable: add scope columns before renames
ALTER TABLE "User" ADD COLUMN "provinceId" TEXT,
ADD COLUMN "districtId" TEXT;

-- Rename columns to match new schema
ALTER TABLE "User" RENAME COLUMN "fullName" TO "name";
ALTER TABLE "User" RENAME COLUMN "policeStationId" TO "stationId";

-- Migrate UserRole enum (ADMIN -> SUPER_ADMIN)
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN', 'POLICE');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE
    WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'::"UserRole_new"
    WHEN "role"::text = 'POLICE' THEN 'POLICE'::"UserRole_new"
    ELSE 'POLICE'::"UserRole_new"
  END
);

DROP TYPE "UserRole";

ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Refresh FK + index for station scope
ALTER TABLE "User" DROP CONSTRAINT "User_policeStationId_fkey";

DROP INDEX IF EXISTS "User_policeStationId_idx";

CREATE INDEX "User_stationId_idx" ON "User"("stationId");

ALTER TABLE "User" ADD CONSTRAINT "User_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Scope FKs
CREATE INDEX "User_provinceId_idx" ON "User"("provinceId");

CREATE INDEX "User_districtId_idx" ON "User"("districtId");

ALTER TABLE "User" ADD CONSTRAINT "User_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Device table (per-tuk-tuk API keys, hashed)
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "tuktukId" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Device_tuktukId_idx" ON "Device"("tuktukId");

ALTER TABLE "Device" ADD CONSTRAINT "Device_tuktukId_fkey" FOREIGN KEY ("tuktukId") REFERENCES "TukTuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
