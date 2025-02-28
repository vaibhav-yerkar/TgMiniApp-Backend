/*
  Warnings:

  - You are about to drop the column `onceTaskCompleted` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `taskCompleted` on the `Users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskState" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'ADMIN_APPROVED');

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "onceTaskCompleted",
DROP COLUMN "taskCompleted";

-- CreateTable
CREATE TABLE "TaskComplete" (
    "id" SERIAL NOT NULL,
    "state" "TaskState" NOT NULL,
    "activity_url" TEXT,
    "image_url" TEXT,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "onceUserId" INTEGER,

    CONSTRAINT "TaskComplete_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskComplete" ADD CONSTRAINT "TaskComplete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComplete" ADD CONSTRAINT "TaskComplete_onceUserId_fkey" FOREIGN KEY ("onceUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
