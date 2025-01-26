/*
  Warnings:

  - You are about to drop the column `userId` on the `Tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `points` to the `Tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tasks" DROP CONSTRAINT "Tasks_userId_fkey";

-- AlterTable
ALTER TABLE "Tasks" DROP COLUMN "userId",
ADD COLUMN     "points" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "_dailyTasks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_dailyTasks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_onceTasks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_onceTasks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_dailyTasks_B_index" ON "_dailyTasks"("B");

-- CreateIndex
CREATE INDEX "_onceTasks_B_index" ON "_onceTasks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- AddForeignKey
ALTER TABLE "_dailyTasks" ADD CONSTRAINT "_dailyTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dailyTasks" ADD CONSTRAINT "_dailyTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_onceTasks" ADD CONSTRAINT "_onceTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_onceTasks" ADD CONSTRAINT "_onceTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
