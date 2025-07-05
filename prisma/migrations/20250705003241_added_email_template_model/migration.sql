/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the `_ContactOwner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TrademarkCases` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `trademarkId` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Trademark" DROP CONSTRAINT "Trademark_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_ContactOwner" DROP CONSTRAINT "_ContactOwner_A_fkey";

-- DropForeignKey
ALTER TABLE "_ContactOwner" DROP CONSTRAINT "_ContactOwner_B_fkey";

-- DropForeignKey
ALTER TABLE "_TrademarkCases" DROP CONSTRAINT "_TrademarkCases_A_fkey";

-- DropForeignKey
ALTER TABLE "_TrademarkCases" DROP CONSTRAINT "_TrademarkCases_B_fkey";

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "ownerId",
ADD COLUMN     "trademarkId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_ContactOwner";

-- DropTable
DROP TABLE "_TrademarkCases";

-- CreateTable
CREATE TABLE "_ContactToOwner" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ContactToOwner_AB_unique" ON "_ContactToOwner"("A", "B");

-- CreateIndex
CREATE INDEX "_ContactToOwner_B_index" ON "_ContactToOwner"("B");

-- AddForeignKey
ALTER TABLE "Trademark" ADD CONSTRAINT "Trademark_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_trademarkId_fkey" FOREIGN KEY ("trademarkId") REFERENCES "Trademark"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToOwner" ADD CONSTRAINT "_ContactToOwner_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToOwner" ADD CONSTRAINT "_ContactToOwner_B_fkey" FOREIGN KEY ("B") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
