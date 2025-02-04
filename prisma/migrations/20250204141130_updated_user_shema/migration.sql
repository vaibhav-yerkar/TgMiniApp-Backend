-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "Invitees" TEXT[] DEFAULT ARRAY[]::TEXT[];
