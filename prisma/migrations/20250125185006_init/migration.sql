-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY', 'ONCE');

-- CreateTable
CREATE TABLE "Tasks" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
