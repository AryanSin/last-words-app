-- DropIndex
DROP INDEX "Message_userId_idx";

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");
