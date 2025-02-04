/*
  Warnings:

  - Made the column `telegramId` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `inviteLink` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "telegramId" SET NOT NULL,
ALTER COLUMN "inviteLink" SET NOT NULL;
