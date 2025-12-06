/*
  Warnings:

  - Added the required column `breed` to the `Pet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "breed" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "neutered" BOOLEAN,
ADD COLUMN     "sex" TEXT,
ADD COLUMN     "weight" INTEGER;
