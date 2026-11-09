-- CreateEnum
CREATE TYPE "PlaceStatus" AS ENUM ('WISHLIST', 'BEEN');

-- CreateEnum
CREATE TYPE "MapUsageKind" AS ENUM ('MAP_LOAD', 'GEOCODE');

-- AlterTable
ALTER TABLE "LogEntry" ADD COLUMN     "placeId" TEXT;

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdById" TEXT,
    "name" TEXT NOT NULL,
    "status" "PlaceStatus" NOT NULL DEFAULT 'WISHLIST',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "recommendedBy" TEXT,
    "notes" TEXT,
    "tags" TEXT[],

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapUsage" (
    "period" TEXT NOT NULL,
    "kind" "MapUsageKind" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MapUsage_pkey" PRIMARY KEY ("period","kind")
);

-- CreateIndex
CREATE INDEX "Place_householdId_idx" ON "Place"("householdId");

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

