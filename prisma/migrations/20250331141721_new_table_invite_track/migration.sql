-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;

-- CreateTable
CREATE TABLE "InviteTrack" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "Invites" BIGINT[] DEFAULT ARRAY[]::BIGINT[],

    CONSTRAINT "InviteTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteTrack_telegramId_key" ON "InviteTrack"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteTrack_username_key" ON "InviteTrack"("username");
