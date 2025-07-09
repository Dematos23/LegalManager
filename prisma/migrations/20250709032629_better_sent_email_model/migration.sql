/*
  Warnings:

  - You are about to drop the column `status` on the `SentEmail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SentEmail" DROP COLUMN "status",
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "openedAt" TIMESTAMP(3);
