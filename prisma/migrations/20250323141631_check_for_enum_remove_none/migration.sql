/*
  Warnings:

  - The values [NONE] on the enum `CheckFor` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CheckFor_new" AS ENUM ('REACT', 'FOLLOW', 'RETWEET', 'REPLY', 'QUOTE');
ALTER TABLE "Tasks" ALTER COLUMN "checkFor" DROP DEFAULT;
ALTER TABLE "Tasks" ALTER COLUMN "checkFor" TYPE "CheckFor_new"[] USING ("checkFor"::text::"CheckFor_new"[]);
ALTER TYPE "CheckFor" RENAME TO "CheckFor_old";
ALTER TYPE "CheckFor_new" RENAME TO "CheckFor";
DROP TYPE "CheckFor_old";
ALTER TABLE "Tasks" ALTER COLUMN "checkFor" SET DEFAULT ARRAY[]::"CheckFor"[];
COMMIT;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
