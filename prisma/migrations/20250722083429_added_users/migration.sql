/*
  Warnings:

  - The primary key for the `Agent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Campaign` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Contact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `EmailTemplate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Owner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `OwnerContact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SentEmail` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Trademark` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TrademarkClass` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `area` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Made the column `type` on table `Trademark` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('ACD', 'LCD');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALES', 'LEGAL', 'MANAGERS', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_emailTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_agentId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerContact" DROP CONSTRAINT "OwnerContact_contactId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerContact" DROP CONSTRAINT "OwnerContact_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "SentEmail" DROP CONSTRAINT "SentEmail_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "SentEmail" DROP CONSTRAINT "SentEmail_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Trademark" DROP CONSTRAINT "Trademark_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "TrademarkClass" DROP CONSTRAINT "TrademarkClass_trademarkId_fkey";

-- AlterTable
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "area",
ADD COLUMN     "area" "Area" NOT NULL,
ADD CONSTRAINT "Agent_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Agent_id_seq";

-- AlterTable
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_pkey",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "emailTemplateId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Campaign_id_seq";

-- AlterTable
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_pkey",
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "agentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Contact_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Contact_id_seq";

-- AlterTable
ALTER TABLE "EmailTemplate" DROP CONSTRAINT "EmailTemplate_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "EmailTemplate_id_seq";

-- AlterTable
ALTER TABLE "Owner" DROP CONSTRAINT "Owner_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Owner_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Owner_id_seq";

-- AlterTable
ALTER TABLE "OwnerContact" DROP CONSTRAINT "OwnerContact_pkey",
ALTER COLUMN "ownerId" SET DATA TYPE TEXT,
ALTER COLUMN "contactId" SET DATA TYPE TEXT,
ADD CONSTRAINT "OwnerContact_pkey" PRIMARY KEY ("ownerId", "contactId");

-- AlterTable
ALTER TABLE "SentEmail" DROP CONSTRAINT "SentEmail_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "campaignId" SET DATA TYPE TEXT,
ALTER COLUMN "contactId" SET DATA TYPE TEXT,
ADD CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "SentEmail_id_seq";

-- AlterTable
ALTER TABLE "Trademark" DROP CONSTRAINT "Trademark_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "certificate" DROP NOT NULL,
ALTER COLUMN "expiration" DROP NOT NULL,
ALTER COLUMN "ownerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Trademark_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Trademark_id_seq";

-- AlterTable
ALTER TABLE "TrademarkClass" DROP CONSTRAINT "TrademarkClass_pkey",
ALTER COLUMN "trademarkId" SET DATA TYPE TEXT,
ADD CONSTRAINT "TrademarkClass_pkey" PRIMARY KEY ("trademarkId", "classId");

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "area" "Area" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trademark" ADD CONSTRAINT "Trademark_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerContact" ADD CONSTRAINT "OwnerContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerContact" ADD CONSTRAINT "OwnerContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrademarkClass" ADD CONSTRAINT "TrademarkClass_trademarkId_fkey" FOREIGN KEY ("trademarkId") REFERENCES "Trademark"("id") ON DELETE CASCADE ON UPDATE CASCADE;
