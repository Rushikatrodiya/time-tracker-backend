/*
  Warnings:

  - A unique constraint covering the columns `[projectKey]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectKey` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketNumber` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('TASK', 'BUG', 'FEAT', 'IMPR');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "lastTicketNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "projectKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'TASK',
ADD COLUMN     "ticketNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectKey_key" ON "Project"("projectKey");
