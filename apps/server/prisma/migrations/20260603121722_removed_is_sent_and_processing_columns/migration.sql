/*
  Warnings:

  - You are about to drop the column `isSent` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `processing` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `processingStartedAt` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "isSent",
DROP COLUMN "processing",
DROP COLUMN "processingStartedAt";
