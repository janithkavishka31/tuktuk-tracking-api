-- CreateTable
CREATE TABLE "TukTuk" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "policeStationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TukTuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tuktukId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "altitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TukTuk_registrationNo_key" ON "TukTuk"("registrationNo");

-- CreateIndex
CREATE INDEX "TukTuk_policeStationId_idx" ON "TukTuk"("policeStationId");

-- CreateIndex
CREATE INDEX "Location_tuktukId_idx" ON "Location"("tuktukId");

-- CreateIndex
CREATE INDEX "Location_createdAt_idx" ON "Location"("createdAt");

-- AddForeignKey
ALTER TABLE "TukTuk" ADD CONSTRAINT "TukTuk_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tuktukId_fkey" FOREIGN KEY ("tuktukId") REFERENCES "TukTuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
