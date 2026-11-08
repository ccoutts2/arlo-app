-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('TRAINING', 'NOTE', 'HEALTH', 'WALK');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('LEARNING', 'GETTING_THERE', 'RELIABLE');

-- AlterEnum
ALTER TYPE "CareType" ADD VALUE 'TRAINING';

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "logEntryId" TEXT;

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "petId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "LogType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "rating" INTEGER,
    "body" TEXT,
    "tags" TEXT[],

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'LEARNING',

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillStep" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "doneAt" TIMESTAMP(3),
    "doneById" TEXT,

    CONSTRAINT "SkillStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntrySkill" (
    "logEntryId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "LogEntrySkill_pkey" PRIMARY KEY ("logEntryId","skillId")
);

-- CreateTable
CREATE TABLE "SkillLevelChange" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skillId" TEXT NOT NULL,
    "from" "SkillLevel" NOT NULL,
    "to" "SkillLevel" NOT NULL,
    "byId" TEXT,
    "logEntryId" TEXT,

    CONSTRAINT "SkillLevelChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogEntry_clientId_key" ON "LogEntry"("clientId");

-- CreateIndex
CREATE INDEX "LogEntry_petId_occurredAt_idx" ON "LogEntry"("petId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_petId_name_key" ON "Skill"("petId", "name");

-- CreateIndex
CREATE INDEX "SkillStep_skillId_idx" ON "SkillStep"("skillId");

-- CreateIndex
CREATE INDEX "SkillLevelChange_skillId_idx" ON "SkillLevelChange"("skillId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_logEntryId_fkey" FOREIGN KEY ("logEntryId") REFERENCES "LogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillStep" ADD CONSTRAINT "SkillStep_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillStep" ADD CONSTRAINT "SkillStep_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntrySkill" ADD CONSTRAINT "LogEntrySkill_logEntryId_fkey" FOREIGN KEY ("logEntryId") REFERENCES "LogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntrySkill" ADD CONSTRAINT "LogEntrySkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillLevelChange" ADD CONSTRAINT "SkillLevelChange_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillLevelChange" ADD CONSTRAINT "SkillLevelChange_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillLevelChange" ADD CONSTRAINT "SkillLevelChange_logEntryId_fkey" FOREIGN KEY ("logEntryId") REFERENCES "LogEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
