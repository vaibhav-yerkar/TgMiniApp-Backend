-- AlterTable
ALTER TABLE "Tasks" ADD COLUMN     "isUploadRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Anmt" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "anmtTasks" INTEGER[],

    CONSTRAINT "Anmt_pkey" PRIMARY KEY ("id")
);
