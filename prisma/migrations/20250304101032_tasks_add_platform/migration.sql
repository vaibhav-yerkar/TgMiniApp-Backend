/*
  Warnings:

  - You are about to drop the column `isUploadRequired` on the `Tasks` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TELEGRAM', 'TWITTER', 'INDEPENDENT');

-- AlterTable
ALTER TABLE "Tasks" DROP COLUMN "isUploadRequired",
ADD COLUMN     "platform" "Platform" NOT NULL DEFAULT 'TELEGRAM';
