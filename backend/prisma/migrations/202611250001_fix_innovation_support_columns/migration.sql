ALTER TABLE "InnovationSupportRequest"
  ADD COLUMN IF NOT EXISTS "targetDeliveryWindow" TEXT,
  ADD COLUMN IF NOT EXISTS "urgencyReason" TEXT,
  ADD COLUMN IF NOT EXISTS "urgencyJustification" TEXT,
  ADD COLUMN IF NOT EXISTS "slaDeadline" TIMESTAMP(3);
