-- AlterTable: Remove customerEmail (user email is available via User relation)
ALTER TABLE "Order" DROP COLUMN IF EXISTS "customerEmail";
