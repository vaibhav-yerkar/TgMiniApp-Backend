/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `InviteTrack` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InviteTrack" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
