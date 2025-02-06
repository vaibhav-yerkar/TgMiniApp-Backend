-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "onceTaskCompleted" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
