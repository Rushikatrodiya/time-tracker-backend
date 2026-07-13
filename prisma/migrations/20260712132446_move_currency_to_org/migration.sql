/*
  Warnings:

  - You are about to drop the column `currency` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "currency" TEXT DEFAULT 'USD';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currency";
