/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `_ContactToOwner` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `country` on table `Agent` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ownerId` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Made the column `country` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `certificate` on table `Trademark` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiration` on table `Trademark` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Trademark" DROP CONSTRAINT "Trademark_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_ContactToOwner" DROP CONSTRAINT "_ContactToOwner_A_fkey";

-- DropForeignKey
ALTER TABLE "_ContactToOwner" DROP CONSTRAINT "_ContactToOwner_B_fkey";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "area" TEXT,
ALTER COLUMN "country" SET NOT NULL;

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Owner" ALTER COLUMN "country" SET NOT NULL;

-- AlterTable
ALTER TABLE "Trademark" ALTER COLUMN "certificate" SET NOT NULL,
ALTER COLUMN "expiration" SET NOT NULL;

-- DropTable
DROP TABLE "_ContactToOwner";

-- CreateTable
CREATE TABLE "_OwnerContacts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OwnerContacts_AB_unique" ON "_OwnerContacts"("A", "B");

-- CreateIndex
CREATE INDEX "_OwnerContacts_B_index" ON "_OwnerContacts"("B");

-- AddForeignKey
ALTER TABLE "Trademark" ADD CONSTRAINT "Trademark_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OwnerContacts" ADD CONSTRAINT "_OwnerContacts_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OwnerContacts" ADD CONSTRAINT "_OwnerContacts_B_fkey" FOREIGN KEY ("B") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
