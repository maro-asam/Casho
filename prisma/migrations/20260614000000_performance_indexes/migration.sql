-- Performance indexes migration
-- Adds indexes for all high-frequency query paths identified during audit

-- ────────────────────────────────────────────────────────────────────────────
-- Store.userId — critical: every server action calls findFirst({ where: { userId } })
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Store_userId_idx" ON "Store"("userId");

-- ────────────────────────────────────────────────────────────────────────────
-- Banner — store home page loads banners with storeId + isActive filter
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Banner_storeId_isActive_idx" ON "Banner"("storeId", "isActive");

-- ────────────────────────────────────────────────────────────────────────────
-- CartItem — hot path: every cart read/write in storefront uses guestSessionId + storeId
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CartItem_guestSessionId_storeId_idx" ON "CartItem"("guestSessionId", "storeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CartItem_storeId_idx" ON "CartItem"("storeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CartItem_userId_idx" ON "CartItem"("userId");

-- ────────────────────────────────────────────────────────────────────────────
-- OrderItem — every order detail view loads items by orderId
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

-- ────────────────────────────────────────────────────────────────────────────
-- Order — dashboard filters by status; customer lookups; guest session lookups
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_storeId_status_createdAt_idx" ON "Order"("storeId", "status", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_storeId_createdAt_idx" ON "Order"("storeId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_guestSessionId_storeId_idx" ON "Order"("guestSessionId", "storeId");

-- ────────────────────────────────────────────────────────────────────────────
-- Product — category page queries; store product listings with ordering
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_storeId_isActive_createdAt_idx" ON "Product"("storeId", "isActive", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_storeId_categoryId_isActive_idx" ON "Product"("storeId", "categoryId", "isActive");

-- ────────────────────────────────────────────────────────────────────────────
-- TopupRequest — admin topup list filters by status; store view filters by storeId+status
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TopupRequest_storeId_status_createdAt_idx" ON "TopupRequest"("storeId", "status", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TopupRequest_status_createdAt_idx" ON "TopupRequest"("status", "createdAt");
