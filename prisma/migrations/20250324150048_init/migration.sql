-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY', 'ONCE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'ADMIN_APPROVED');

-- CreateEnum
CREATE TYPE "SubmitType" AS ENUM ('NONE', 'LINK', 'IMAGE', 'BOTH');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TELEGRAM', 'TWITTER', 'INDEPENDENT');

-- CreateEnum
CREATE TYPE "CheckFor" AS ENUM ('REACT', 'FOLLOW', 'RETWEET', 'REPLY', 'QUOTE');

-- CreateTable
CREATE TABLE "TaskComplete" (
    "id" SERIAL NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "activity_url" TEXT,
    "image_url" TEXT,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComplete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "cta" TEXT NOT NULL DEFAULT 'Complete',
    "description" TEXT,
    "link" TEXT NOT NULL,
    "image" TEXT,
    "submitType" "SubmitType" NOT NULL DEFAULT 'NONE',
    "type" "TaskType" NOT NULL,
    "checkFor" "CheckFor"[] DEFAULT ARRAY[]::"CheckFor"[],
    "points" INTEGER NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'TELEGRAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "taskScore" INTEGER NOT NULL DEFAULT 0,
    "inviteScore" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "onceTaskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "Invitees" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "twitterInvitees" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "twitterId" BIGINT,
    "twitterUsername" TEXT,
    "referCode" INTEGER NOT NULL DEFAULT ((floor(random()*900000)+100000))::integer,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anmt" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "anmtTasks" INTEGER[],

    CONSTRAINT "Anmt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_telegramId_key" ON "Users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_twitterId_key" ON "Users"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_twitterUsername_key" ON "Users"("twitterUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Users_referCode_key" ON "Users"("referCode");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- AddForeignKey
ALTER TABLE "TaskComplete" ADD CONSTRAINT "TaskComplete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
