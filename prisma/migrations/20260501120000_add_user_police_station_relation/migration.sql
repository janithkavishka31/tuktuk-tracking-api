-- AlterTable
ALTER TABLE "User" ADD COLUMN "policeStationId" TEXT;

-- CreateIndex
CREATE INDEX "User_policeStationId_idx" ON "User"("policeStationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
