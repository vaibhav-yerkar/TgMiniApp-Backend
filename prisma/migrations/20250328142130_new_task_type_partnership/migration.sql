-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE 'PARTNERSHIP';

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
