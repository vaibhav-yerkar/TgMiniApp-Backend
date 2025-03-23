-- CreateEnum
CREATE TYPE "CheckFor" AS ENUM ('NONE', 'FOLLOW', 'RETWEET', 'REPLY', 'QUOTE');

-- AlterTable
ALTER TABLE "TaskComplete" ADD COLUMN     "checkFor" "CheckFor"[] DEFAULT ARRAY['NONE']::"CheckFor"[];

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
