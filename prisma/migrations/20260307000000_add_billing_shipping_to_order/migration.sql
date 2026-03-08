-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('CONSUMIDOR_FINAL', 'FACTURA_A');

-- AlterTable: Add billing fields
ALTER TABLE "Order" ADD COLUMN "invoiceType" "InvoiceType" NOT NULL DEFAULT 'CONSUMIDOR_FINAL';
ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "dni" TEXT;
ALTER TABLE "Order" ADD COLUMN "cuit" TEXT;
ALTER TABLE "Order" ADD COLUMN "businessName" TEXT;
ALTER TABLE "Order" ADD COLUMN "taxCondition" TEXT;

-- AlterTable: Add shipping fields
ALTER TABLE "Order" ADD COLUMN "shippingAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingProvince" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingZipCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingNotes" TEXT;
