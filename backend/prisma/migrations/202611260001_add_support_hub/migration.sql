-- This migration is additive and safe to rerun after Prisma marks a failed attempt
-- as rolled back. Existing JHUB databases may already contain these support tables.
DO $$ BEGIN
  CREATE TYPE "SupportCategory" AS ENUM ('COMPUTE_AI', 'DATA_RESEARCH', 'MENTORSHIP_DOMAIN_EXPERTISE', 'FIELD_VALIDATION', 'TECHNICAL_DEVELOPMENT', 'PRODUCT_BUSINESS_SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'APPROVED', 'DECLINED', 'DEFERRED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportUpdateVisibility" AS ENUM ('REQUESTER', 'INTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportUpdateKind" AS ENUM ('COMMENT', 'CLARIFICATION_REQUEST', 'CLARIFICATION_RESPONSE', 'STATUS_CHANGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SupportProject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "innovatorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportRequest" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "SupportCategory" NOT NULL,
  "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "SupportRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "details" JSONB NOT NULL,
  "projectId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "assignedToId" TEXT,
  "declineReason" TEXT,
  "deferReason" TEXT,
  "deliverySummary" TEXT,
  "actualOutcome" TEXT,
  "completedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "evidenceLinks" JSONB,
  CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportUpdate" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "visibility" "SupportUpdateVisibility" NOT NULL DEFAULT 'REQUESTER',
  "kind" "SupportUpdateKind" NOT NULL DEFAULT 'COMMENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportFeedback" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportFeedback_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportProject"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("innovatorId")%') THEN
    ALTER TABLE "SupportProject" ADD CONSTRAINT "SupportProject_innovatorId_fkey" FOREIGN KEY ("innovatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportRequest"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("projectId")%') THEN
    ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SupportProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportRequest"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("requesterId")%') THEN
    ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportRequest"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("assignedToId")%') THEN
    ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportUpdate"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("requestId")%') THEN
    ALTER TABLE "SupportUpdate" ADD CONSTRAINT "SupportUpdate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportUpdate"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("authorId")%') THEN
    ALTER TABLE "SupportUpdate" ADD CONSTRAINT "SupportUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"SupportFeedback"'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%("requestId")%') THEN
    ALTER TABLE "SupportFeedback" ADD CONSTRAINT "SupportFeedback_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
