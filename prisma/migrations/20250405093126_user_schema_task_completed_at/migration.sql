/*
  Warnings:

  - The `taskCompleted` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `onceTaskCompleted` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "taskCompleted",
ADD COLUMN     "taskCompleted" JSONB[] DEFAULT ARRAY[]::JSONB[],
DROP COLUMN "onceTaskCompleted",
ADD COLUMN     "onceTaskCompleted" JSONB[] DEFAULT ARRAY[]::JSONB[],
ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
