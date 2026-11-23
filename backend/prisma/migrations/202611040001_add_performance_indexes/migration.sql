CREATE INDEX "Asset_category_idx" ON "Asset"("category");
CREATE INDEX "Asset_availableQty_idx" ON "Asset"("availableQty");
CREATE INDEX "AssetRequest_status_createdAt_idx" ON "AssetRequest"("status", "createdAt");
CREATE INDEX "AssetRequest_createdAt_idx" ON "AssetRequest"("createdAt");
