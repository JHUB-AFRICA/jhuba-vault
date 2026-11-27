ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'COMPUTE_AI';
ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'DATA_RESEARCH';
ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'MENTORSHIP_DOMAIN_EXPERTISE';
ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'FIELD_VALIDATION';
ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'TECHNICAL_DEVELOPMENT';
ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'PRODUCT_BUSINESS_SUPPORT';

ALTER TYPE "InnovationRequestStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "InnovationRequestStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "InnovationRequestStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommentVisibility') THEN
    CREATE TYPE "CommentVisibility" AS ENUM ('REQUESTER_VISIBLE', 'INTERNAL_ONLY');
  END IF;
END $$;

ALTER TABLE "InnovationSupportRequest"
  ADD COLUMN IF NOT EXISTS "referenceCode" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryDetails" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "declineReason" TEXT,
  ADD COLUMN IF NOT EXISTS "clarificationPrompt" TEXT;

UPDATE "InnovationSupportRequest"
SET "referenceCode" = 'ISH-' || EXTRACT(YEAR FROM "createdAt")::TEXT || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY "createdAt", "id") % 10000)::TEXT, 4, '0')
WHERE "referenceCode" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "InnovationSupportRequest_referenceCode_key" ON "InnovationSupportRequest"("referenceCode");
ALTER TABLE "InnovationSupportRequest" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "InnovationProjectMember" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InnovationProjectMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InnovationProjectMember_projectId_userId_key" ON "InnovationProjectMember"("projectId", "userId");
ALTER TABLE "InnovationProjectMember" ADD CONSTRAINT "InnovationProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SupportAssignment" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportAssignment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SupportAssignment" DROP CONSTRAINT IF EXISTS "SupportAssignment_requestId_fkey";
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RequestComment" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "visibility" "CommentVisibility" NOT NULL DEFAULT 'REQUESTER_VISIBLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InnovationSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SupportDelivery" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "recorderId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "actualOutcome" TEXT NOT NULL,
  "evidenceLinks" JSONB NOT NULL DEFAULT '[]',
  "deliveryDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupportDelivery_requestId_key" ON "SupportDelivery"("requestId");
ALTER TABLE "SupportDelivery" ADD CONSTRAINT "SupportDelivery_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InnovationSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportDelivery" ADD CONSTRAINT "SupportDelivery_recorderId_fkey" FOREIGN KEY ("recorderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SupportFeedback" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportFeedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupportFeedback_requestId_key" ON "SupportFeedback"("requestId");
ALTER TABLE "SupportFeedback" ADD CONSTRAINT "SupportFeedback_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InnovationSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportFeedback" ADD CONSTRAINT "SupportFeedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
