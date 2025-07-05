/*
  Warnings:

  - The values [WORD] on the enum `TrademarkType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `trademark` on the `Trademark` table. All the data in the column will be lost.
  - Added the required column `name` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `denomination` to the `Trademark` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrademarkType_new" AS ENUM ('NOMINATIVE', 'FIGURATIVE', 'MIXED');
ALTER TABLE "Trademark" ALTER COLUMN "type" TYPE "TrademarkType_new" USING ("type"::text::"TrademarkType_new");
ALTER TYPE "TrademarkType" RENAME TO "TrademarkType_old";
ALTER TYPE "TrademarkType_new" RENAME TO "TrademarkType";
DROP TYPE "TrademarkType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "country" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Owner" ALTER COLUMN "country" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trademark" DROP COLUMN "trademark",
ADD COLUMN     "denomination" TEXT NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "certificate" DROP NOT NULL,
ALTER COLUMN "expiration" DROP NOT NULL;
