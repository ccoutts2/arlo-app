-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('MEDICATION', 'FLEA_TICK', 'WORMING', 'VACCINE', 'APPOINTMENT', 'GROOMING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Repeat" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "CareItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "petId" TEXT NOT NULL,
    "createdById" TEXT,
    "type" "CareType" NOT NULL,
    "title" TEXT NOT NULL,
    "dose" TEXT,
    "notes" TEXT,
    "stock" INTEGER,
    "repeat" "Repeat" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "times" TEXT[],
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "generatedUntil" TIMESTAMP(3),

    CONSTRAINT "CareItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occurrence" (
    "id" TEXT NOT NULL,
    "careItemId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "snoozedUntil" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "doneById" TEXT,

    CONSTRAINT "Occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareItem_petId_idx" ON "CareItem"("petId");

-- CreateIndex
CREATE INDEX "Occurrence_dueAt_status_idx" ON "Occurrence"("dueAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Occurrence_careItemId_dueAt_key" ON "Occurrence"("careItemId", "dueAt");

-- AddForeignKey
ALTER TABLE "CareItem" ADD CONSTRAINT "CareItem_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareItem" ADD CONSTRAINT "CareItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_careItemId_fkey" FOREIGN KEY ("careItemId") REFERENCES "CareItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
