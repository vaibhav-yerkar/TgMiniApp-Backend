/*
  Warnings:

  - You are about to drop the column `taskScore` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "taskScore",
ADD COLUMN     "xpHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
