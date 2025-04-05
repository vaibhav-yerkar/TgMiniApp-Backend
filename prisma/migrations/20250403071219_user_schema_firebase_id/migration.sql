/*
  Warnings:

  - A unique constraint covering the columns `[firebaseId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "firebaseId" TEXT,
ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;

-- CreateIndex
CREATE UNIQUE INDEX "Users_firebaseId_key" ON "Users"("firebaseId");
