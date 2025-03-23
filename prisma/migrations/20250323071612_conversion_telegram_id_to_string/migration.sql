-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "telegramId" SET DATA TYPE TEXT,
ALTER COLUMN "Invitees" SET DATA TYPE TEXT[],
ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer,
ALTER COLUMN "twitterInvitees" SET DATA TYPE TEXT[];
