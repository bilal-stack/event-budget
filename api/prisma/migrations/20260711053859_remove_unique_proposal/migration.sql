-- DropForeignKey
ALTER TABLE `aiproposal` DROP FOREIGN KEY `AiProposal_eventId_fkey`;

-- DropIndex
DROP INDEX `AiProposal_eventId_key` ON `aiproposal`;

-- AddForeignKey
ALTER TABLE `AiProposal` ADD CONSTRAINT `AiProposal_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
