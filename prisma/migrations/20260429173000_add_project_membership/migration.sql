-- AlterTable
ALTER TABLE `Task` ADD COLUMN `createdBy` BIGINT NULL;

-- CreateTable
CREATE TABLE `ProjectMembership` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `projectId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `role` VARCHAR(191) NULL,

    UNIQUE INDEX `ProjectMembership_projectId_userId_key`(`projectId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectMembership` ADD CONSTRAINT `ProjectMembership_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMembership` ADD CONSTRAINT `ProjectMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
