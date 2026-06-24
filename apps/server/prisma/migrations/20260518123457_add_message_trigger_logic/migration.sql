-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isTriggered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "triggerAfterDays" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultTriggerAfterDays" INTEGER NOT NULL DEFAULT 365;
