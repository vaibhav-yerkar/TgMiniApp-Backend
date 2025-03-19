/*
  Warnings:

  - A unique constraint covering the columns `[twitterId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[twitterUsername]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referCode]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "referCode" INTEGER NOT NULL DEFAULT ((floor(random()*900000)+100000))::integer;

-- CreateIndex
CREATE UNIQUE INDEX "Users_twitterId_key" ON "Users"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_twitterUsername_key" ON "Users"("twitterUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Users_referCode_key" ON "Users"("referCode");
