-- CreateEnum
CREATE TYPE "AuditLogActions" AS ENUM ('LOGIN', 'MESSAGE_CREATED', 'MESSAGE_TRIGGERED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archived" BOOLEAN DEFAULT false;
