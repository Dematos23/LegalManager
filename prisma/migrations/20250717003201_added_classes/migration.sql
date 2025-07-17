/*
  Warnings:

  - You are about to drop the column `class` on the `Trademark` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trademark" DROP COLUMN "class";

-- CreateTable
CREATE TABLE "TrademarkClass" (
    "trademarkId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "TrademarkClass_pkey" PRIMARY KEY ("trademarkId","classId")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrademarkClass" ADD CONSTRAINT "TrademarkClass_trademarkId_fkey" FOREIGN KEY ("trademarkId") REFERENCES "Trademark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrademarkClass" ADD CONSTRAINT "TrademarkClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
