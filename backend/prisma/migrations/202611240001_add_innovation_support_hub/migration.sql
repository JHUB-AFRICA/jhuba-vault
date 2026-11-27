CREATE TYPE "InnovationRequestCategory" AS ENUM ('BUG_FIX_ERROR_REPORT', 'DATABASE_BACKEND_SUPPORT', 'UI_UX_PROTOTYPING_DESIGN', 'ENVIRONMENT_DEPLOYMENT', 'FEATURE_ENHANCEMENT', 'GENERAL_INQUIRY_MENTORSHIP', 'OTHER');
CREATE TYPE "InnovationRequestPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "InnovationRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO', 'APPROVED', 'DEFERRED', 'DECLINED', 'CLOSED');

CREATE TABLE "InnovationProject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InnovationProject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InnovationProject_name_key" ON "InnovationProject"("name");
ALTER TABLE "InnovationProject" ADD CONSTRAINT "InnovationProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "InnovationSupportRequest" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "assignedToId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "InnovationRequestCategory" NOT NULL,
  "priority" "InnovationRequestPriority" NOT NULL,
  "country" TEXT NOT NULL,
  "slaDeadline" TIMESTAMP(3),
  "targetDeliveryWindow" TEXT,
  "urgencyReason" TEXT,
  "urgencyJustification" TEXT,
  "status" "InnovationRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InnovationSupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InnovationSupportRequest_projectId_status_idx" ON "InnovationSupportRequest"("projectId", "status");
CREATE INDEX "InnovationSupportRequest_createdById_status_idx" ON "InnovationSupportRequest"("createdById", "status");
ALTER TABLE "InnovationSupportRequest" ADD CONSTRAINT "InnovationSupportRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InnovationProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InnovationSupportRequest" ADD CONSTRAINT "InnovationSupportRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InnovationSupportRequest" ADD CONSTRAINT "InnovationSupportRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "InnovationRequestHistory" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "previousStatus" "InnovationRequestStatus" NOT NULL,
  "newStatus" "InnovationRequestStatus" NOT NULL,
  "changedById" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InnovationRequestHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InnovationRequestHistory" ADD CONSTRAINT "InnovationRequestHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InnovationSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InnovationRequestHistory" ADD CONSTRAINT "InnovationRequestHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
