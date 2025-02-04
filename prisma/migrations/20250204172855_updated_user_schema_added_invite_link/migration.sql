/*
  Warnings:

  - A unique constraint covering the columns `[inviteLink]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "inviteLink" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_inviteLink_key" ON "Users"("inviteLink");
