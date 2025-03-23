/*
  Warnings:

  - You are about to drop the column `checkFor` on the `TaskComplete` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TaskComplete" DROP COLUMN "checkFor";

-- AlterTable
ALTER TABLE "Tasks" ADD COLUMN     "checkFor" "CheckFor"[] DEFAULT ARRAY['NONE']::"CheckFor"[];

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
