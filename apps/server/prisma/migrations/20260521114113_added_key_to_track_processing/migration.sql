-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "processing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processingStartedAt" TIMESTAMP(3);
