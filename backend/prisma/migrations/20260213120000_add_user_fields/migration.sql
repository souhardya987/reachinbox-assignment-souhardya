-- AlterTable
ALTER TABLE "ScheduledEmail" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "fromEmail" TEXT NOT NULL DEFAULT 'user@example.com';
