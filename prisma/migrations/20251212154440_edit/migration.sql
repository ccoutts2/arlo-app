/*
  Warnings:

  - Added the required column `scheduledAt` to the `ReminderInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReminderInstance" ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "completedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Reminders" ALTER COLUMN "description" DROP NOT NULL;
