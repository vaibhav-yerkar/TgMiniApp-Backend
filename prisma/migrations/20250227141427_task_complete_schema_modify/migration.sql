/*
  Warnings:

  - You are about to drop the column `onceUserId` on the `TaskComplete` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `TaskComplete` table. All the data in the column will be lost.
  - Added the required column `status` to the `TaskComplete` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'ADMIN_APPROVED');

-- DropForeignKey
ALTER TABLE "TaskComplete" DROP CONSTRAINT "TaskComplete_onceUserId_fkey";

-- AlterTable
ALTER TABLE "TaskComplete" DROP COLUMN "onceUserId",
DROP COLUMN "state",
ADD COLUMN     "status" "TaskStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "onceTaskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "taskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- DropEnum
DROP TYPE "TaskState";
