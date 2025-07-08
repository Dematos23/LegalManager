/*
  Warnings:

  - The values [ARMENIA,AZERBAIJAN,BOSNIA_AND_HERZEGOVINA,CHINA,CONGO,CZECH_REPUBLIC,KOREA_NORTH,KOREA_SOUTH,KOSOVO,OTHER] on the enum `Country` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOMINATIVE] on the enum `TrademarkType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Case` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Country_new" AS ENUM ('ARGENTINA', 'BOLIVIA', 'BRAZIL', 'CHILE', 'COLOMBIA', 'ECUADOR', 'PARAGUAY', 'PERU', 'URUGUAY', 'VENEZUELA', 'USA', 'SPAIN', 'AFGHANISTAN', 'ALBANIA', 'ALGERIA', 'ANDORRA', 'ANGOLA', 'ANTIGUA_AND_BARBUDA', 'AUSTRALIA', 'AUSTRIA', 'BAHAMAS', 'BAHRAIN', 'BANGLADESH', 'BARBADOS', 'BELARUS', 'BELGIUM', 'BELIZE', 'BENIN', 'BHUTAN', 'BOTSWANA', 'BRUNEI', 'BULGARIA', 'BURKINA_FASO', 'BURUNDI', 'CABO_VERDE', 'CAMBODIA', 'CAMEROON', 'CANADA', 'CENTRAL_AFRICAN_REPUBLIC', 'CHAD', 'COMOROS', 'CONGO_BRAZZAVILLE', 'CONGO_KINSHASA', 'COSTA_RICA', 'COTE_D_IVOIRE', 'CROATIA', 'CUBA', 'CYPRUS', 'CZECHIA', 'DENMARK', 'DJIBOUTI', 'DOMINICA', 'DOMINICAN_REPUBLIC', 'EGYPT', 'EL_SALVADOR', 'EQUATORIAL_GUINEA', 'ERITREA', 'ESTONIA', 'ESWATINI', 'ETHIOPIA', 'FIJI', 'FINLAND', 'FRANCE', 'GABON', 'GAMBIA', 'GEORGIA', 'GERMANY', 'GHANA', 'GREECE', 'GRENADA', 'GUATEMALA', 'GUINEA', 'GUINEA_BISSAU', 'GUYANA', 'HAITI', 'HONDURAS', 'HUNGARY', 'ICELAND', 'INDIA', 'INDONESIA', 'IRAN', 'IRAQ', 'IRELAND', 'ISRAEL', 'ITALY', 'JAMAICA', 'JAPAN', 'JORDAN', 'KAZAKHSTAN', 'KENYA', 'KIRIBATI', 'KUWAIT', 'KYRGYZSTAN', 'LAOS', 'LATVIA', 'LEBANON', 'LESOTHO', 'LIBERIA', 'LIBYA', 'LIECHTENSTEIN', 'LITHUANIA', 'LUXEMBOURG', 'MADAGASCAR', 'MALAWI', 'MALAYSIA', 'MALDIVES', 'MALI', 'MALTA', 'MARSHALL_ISLANDS', 'MAURITANIA', 'MAURITIUS', 'MEXICO', 'MICRONESIA', 'MOLDOVA', 'MONACO', 'MONGOLIA', 'MONTENEGRO', 'MOROCCO', 'MOZAMBIQUE', 'MYANMAR', 'NAMIBIA', 'NAURU', 'NEPAL', 'NETHERLANDS', 'NEW_ZEALAND', 'NICARAGUA', 'NIGER', 'NIGERIA', 'NORTH_KOREA', 'NORTH_MACEDONIA', 'NORWAY', 'OMAN', 'PAKISTAN', 'PALAU', 'PALESTINE', 'PANAMA', 'PAPUA_NEW_GUINEA', 'PHILIPPINES', 'POLAND', 'PORTUGAL', 'QATAR', 'ROMANIA', 'RUSSIA', 'RWANDA', 'SAINT_KITTS_AND_NEVIS', 'SAINT_LUCIA', 'SAINT_VINCENT_AND_THE_GRENADINES', 'SAMOA', 'SAN_MARINO', 'SAO_TOME_AND_PRINCIPE', 'SAUDI_ARABIA', 'SENEGAL', 'SERBIA', 'SEYCHELLES', 'SIERRA_LEONE', 'SINGAPORE', 'SLOVAKIA', 'SLOVENIA', 'SOLOMON_ISLANDS', 'SOMALIA', 'SOUTH_AFRICA', 'SOUTH_KOREA', 'SOUTH_SUDAN', 'SRI_LANKA', 'SUDAN', 'SURINAME', 'SWEDEN', 'SWITZERLAND', 'SYRIA', 'TAIWAN', 'TAJIKISTAN', 'TANZANIA', 'THAILAND', 'TIMOR_LESTE', 'TOGO', 'TONGA', 'TRINIDAD_AND_TOBAGO', 'TUNISIA', 'TURKEY', 'TURKMENISTAN', 'TUVALU', 'UGANDA', 'UKRAINE', 'UNITED_ARAB_EMIRATES', 'UNITED_KINGDOM', 'UNITED_STATES', 'UZBEKISTAN', 'VANUATU', 'VATICAN_CITY', 'VIETNAM', 'YEMEN', 'ZAMBIA', 'ZIMBABWE');
ALTER TABLE "Owner" ALTER COLUMN "country" TYPE "Country_new" USING ("country"::text::"Country_new");
ALTER TABLE "Agent" ALTER COLUMN "country" TYPE "Country_new" USING ("country"::text::"Country_new");
ALTER TYPE "Country" RENAME TO "Country_old";
ALTER TYPE "Country_new" RENAME TO "Country";
DROP TYPE "Country_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TrademarkType_new" AS ENUM ('WORD', 'FIGURATIVE', 'MIXED');
ALTER TABLE "Trademark" ALTER COLUMN "type" TYPE "TrademarkType_new" USING ("type"::text::"TrademarkType_new");
ALTER TYPE "TrademarkType" RENAME TO "TrademarkType_old";
ALTER TYPE "TrademarkType_new" RENAME TO "TrademarkType";
DROP TYPE "TrademarkType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_trademarkId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_caseId_fkey";

-- DropTable
DROP TABLE "Case";

-- DropTable
DROP TABLE "Order";

-- DropEnum
DROP TYPE "OrderType";

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailTemplateId" INTEGER NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentEmail" (
    "id" SERIAL NOT NULL,
    "resendId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentEmail_resendId_key" ON "SentEmail"("resendId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
