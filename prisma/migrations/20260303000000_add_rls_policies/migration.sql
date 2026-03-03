-- ============================================================================
-- Enable RLS on tables that are missing it (fixes ERROR: rls_disabled_in_public)
-- ============================================================================

ALTER TABLE "public"."ShippingTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PricingConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FixedCost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VolumeDiscount" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Catalog tables: authenticated users can read (fixes INFO: rls_enabled_no_policy)
-- These are reference/config tables. Only admins write via Prisma (bypasses RLS).
-- ============================================================================

CREATE POLICY "authenticated_read" ON "public"."Material"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."MaterialType"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."MaterialTypeCut"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."CutType"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."ExtraService"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."ShippingTier"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."PricingConfig"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."FixedCost"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON "public"."VolumeDiscount"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- User table: users can read their own profile
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."User"
  FOR SELECT TO authenticated USING (auth.uid()::text = id);

-- ============================================================================
-- Address: users can manage their own addresses
-- ============================================================================

CREATE POLICY "users_manage_own" ON "public"."Address"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- ============================================================================
-- File: users can manage their own files
-- ============================================================================

CREATE POLICY "users_manage_own" ON "public"."File"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- ============================================================================
-- Cart & CartItem: users can manage their own cart
-- ============================================================================

CREATE POLICY "users_manage_own" ON "public"."Cart"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "users_manage_own" ON "public"."CartItem"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Cart"
      WHERE "Cart".id = "CartItem"."cartId"
      AND "Cart"."userId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."Cart"
      WHERE "Cart".id = "CartItem"."cartId"
      AND "Cart"."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- Order: users can read their own orders
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."Order"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = "userId");

-- ============================================================================
-- OrderItem: users can read items from their orders
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."OrderItem"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Order"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- OrderExtra: users can read extras from their orders
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."OrderExtra"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Order"
      WHERE "Order".id = "OrderExtra"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- Payment: users can read payments from their orders
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."Payment"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Order"
      WHERE "Order".id = "Payment"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- Shipment: users can read shipments from their orders
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."Shipment"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Order"
      WHERE "Order".id = "Shipment"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- ShipmentItem: users can read shipment items from their shipments
-- ============================================================================

CREATE POLICY "users_read_own" ON "public"."ShipmentItem"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Shipment"
      JOIN "public"."Order" ON "Order".id = "Shipment"."orderId"
      WHERE "Shipment".id = "ShipmentItem"."shipmentId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- _prisma_migrations: no access via PostgREST (policy exists to silence linter)
-- ============================================================================

CREATE POLICY "deny_all" ON "public"."_prisma_migrations"
  FOR SELECT TO authenticated USING (false);
