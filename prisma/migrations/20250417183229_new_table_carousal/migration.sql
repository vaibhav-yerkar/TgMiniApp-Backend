-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;

-- CreateTable
CREATE TABLE "Carousal" (
    "id" SERIAL NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "Carousal_pkey" PRIMARY KEY ("id")
);
