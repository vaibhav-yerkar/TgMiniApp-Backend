-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "twitterId" SET DATA TYPE TEXT,
ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
