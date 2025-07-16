/*
  Warnings:

  - You are about to drop the `_OwnerContacts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_OwnerContacts" DROP CONSTRAINT "_OwnerContacts_A_fkey";

-- DropForeignKey
ALTER TABLE "_OwnerContacts" DROP CONSTRAINT "_OwnerContacts_B_fkey";

-- DropTable
DROP TABLE "_OwnerContacts";

-- CreateTable
CREATE TABLE "OwnerContact" (
    "ownerId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerContact_pkey" PRIMARY KEY ("ownerId","contactId")
);

-- AddForeignKey
ALTER TABLE "OwnerContact" ADD CONSTRAINT "OwnerContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerContact" ADD CONSTRAINT "OwnerContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
