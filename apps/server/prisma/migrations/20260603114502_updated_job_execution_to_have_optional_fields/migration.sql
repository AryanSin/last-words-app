-- AlterTable
ALTER TABLE "JobExecution" ALTER COLUMN "completedAt" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;
