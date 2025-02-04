-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY', 'ONCE');

-- CreateTable
CREATE TABLE "Tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "cta" TEXT NOT NULL DEFAULT 'Complete',
    "description" TEXT,
    "link" TEXT NOT NULL,
    "image" TEXT,
    "type" "TaskType" NOT NULL,
    "points" INTEGER NOT NULL,
    "createadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "telegramId" INTEGER,
    "username" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "taskScore" INTEGER NOT NULL DEFAULT 0,
    "inviteScore" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "Invitees" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_telegramId_key" ON "Users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
