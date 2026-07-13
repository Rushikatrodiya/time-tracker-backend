/*
  Warnings:

  - You are about to drop the column `managerId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_managerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "managerId",
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "hourlyRate" DECIMAL(10,2);
