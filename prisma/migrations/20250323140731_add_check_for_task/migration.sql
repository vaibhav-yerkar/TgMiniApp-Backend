-- AlterTable
ALTER TABLE "Tasks" ALTER COLUMN "checkFor" SET DEFAULT ARRAY[]::"CheckFor"[];

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "referCode" SET DEFAULT ((floor(random()*900000)+100000))::integer;
