/*
  Warnings:

  - You are about to drop the column `score` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the `_dailyTasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_onceTasks` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[telegramId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_dailyTasks" DROP CONSTRAINT "_dailyTasks_A_fkey";

-- DropForeignKey
ALTER TABLE "_dailyTasks" DROP CONSTRAINT "_dailyTasks_B_fkey";

-- DropForeignKey
ALTER TABLE "_onceTasks" DROP CONSTRAINT "_onceTasks_A_fkey";

-- DropForeignKey
ALTER TABLE "_onceTasks" DROP CONSTRAINT "_onceTasks_B_fkey";

-- AlterTable
ALTER TABLE "Tasks" ADD COLUMN     "cta" TEXT NOT NULL DEFAULT 'Complete',
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "score",
ADD COLUMN     "inviteScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "taskScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "telegramId" INTEGER,
ADD COLUMN     "totalScore" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "_dailyTasks";

-- DropTable
DROP TABLE "_onceTasks";

-- CreateIndex
CREATE UNIQUE INDEX "Users_telegramId_key" ON "Users"("telegramId");
