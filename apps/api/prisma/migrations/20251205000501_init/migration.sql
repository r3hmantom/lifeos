/*
  Warnings:

  - You are about to drop the column `date` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Memory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "date",
DROP COLUMN "tags";
