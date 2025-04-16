-- AlterTable
ALTER TABLE "InviteTrack" ALTER COLUMN "Invites" SET DATA TYPE TEXT[];

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
