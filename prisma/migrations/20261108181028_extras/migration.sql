-- AlterTable
ALTER TABLE "CareItem" ADD COLUMN     "refillAt" INTEGER,
ADD COLUMN     "refillNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Occurrence" ADD COLUMN     "doneByName" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "sitterNotes" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarTokenHash" TEXT;

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kg" DECIMAL(5,2) NOT NULL,
    "petId" TEXT NOT NULL,
    "byId" TEXT,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitterLink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenHash" TEXT NOT NULL,
    "sitterName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "householdId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "SitterLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeightEntry_petId_at_idx" ON "WeightEntry"("petId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "SitterLink_tokenHash_key" ON "SitterLink"("tokenHash");

-- CreateIndex
CREATE INDEX "SitterLink_householdId_idx" ON "SitterLink"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "User_calendarTokenHash_key" ON "User"("calendarTokenHash");

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitterLink" ADD CONSTRAINT "SitterLink_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitterLink" ADD CONSTRAINT "SitterLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

