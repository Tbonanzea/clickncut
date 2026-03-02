-- CreateTable
CREATE TABLE "ShippingTier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "maxShortCm" DOUBLE PRECISION NOT NULL,
    "maxLongCm" DOUBLE PRECISION NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingTier_pkey" PRIMARY KEY ("id")
);
