-- CreateEnum
CREATE TYPE "SubmitType" AS ENUM ('NONE', 'LINK', 'IMAGE', 'BOTH');

-- AlterTable
ALTER TABLE "Tasks" ADD COLUMN     "submitType" "SubmitType" NOT NULL DEFAULT 'NONE';
