CREATE INDEX "AssetRequest_status_expectedReturn_idx" ON "AssetRequest"("status", "expectedReturn");
CREATE INDEX "TeamMember_requestId_idx" ON "TeamMember"("requestId");
CREATE INDEX "RequestItem_assetId_idx" ON "RequestItem"("assetId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
