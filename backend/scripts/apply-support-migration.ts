import { prisma } from '../src/config/prisma';

async function main() {
  const statements = [
    `ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'COMPUTE_AI'`,
    `ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'DATA_RESEARCH'`,
    `ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'MENTORSHIP_DOMAIN_EXPERTISE'`,
    `ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'FIELD_VALIDATION'`,
    `ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'TECHNICAL_DEVELOPMENT'`,
    `ALTER TYPE "InnovationRequestCategory" ADD VALUE IF NOT EXISTS 'PRODUCT_BUSINESS_SUPPORT'`,
    `ALTER TYPE "InnovationRequestStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED'`,
    `ALTER TYPE "InnovationRequestStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`,
    `ALTER TYPE "InnovationRequestStatus" ADD VALUE IF NOT EXISTS 'COMPLETED'`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommentVisibility') THEN CREATE TYPE "CommentVisibility" AS ENUM ('REQUESTER_VISIBLE', 'INTERNAL_ONLY'); END IF; END $$`,
    `ALTER TABLE "InnovationSupportRequest" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT`,
    `ALTER TABLE "InnovationSupportRequest" ADD COLUMN IF NOT EXISTS "categoryDetails" JSONB NOT NULL DEFAULT '{}'`,
    `ALTER TABLE "InnovationSupportRequest" ADD COLUMN IF NOT EXISTS "declineReason" TEXT`,
    `ALTER TABLE "InnovationSupportRequest" ADD COLUMN IF NOT EXISTS "clarificationPrompt" TEXT`,
    `WITH numbered AS (SELECT "id", 'ISH-' || EXTRACT(YEAR FROM "createdAt")::TEXT || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY "createdAt", "id") % 10000)::TEXT, 4, '0') AS code FROM "InnovationSupportRequest" WHERE "referenceCode" IS NULL) UPDATE "InnovationSupportRequest" r SET "referenceCode" = numbered.code FROM numbered WHERE r."id" = numbered."id"`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "InnovationSupportRequest_referenceCode_key" ON "InnovationSupportRequest"("referenceCode")`,
    `ALTER TABLE "InnovationSupportRequest" ALTER COLUMN "referenceCode" SET NOT NULL`,
    `CREATE TABLE IF NOT EXISTS "InnovationProjectMember" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "userId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'MEMBER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "InnovationProjectMember_pkey" PRIMARY KEY ("id"))`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "InnovationProjectMember_projectId_userId_key" ON "InnovationProjectMember"("projectId", "userId")`,
    `CREATE TABLE IF NOT EXISTS "SupportAssignment" ("id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "status" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SupportAssignment_pkey" PRIMARY KEY ("id"))`,
    `CREATE TABLE IF NOT EXISTS "RequestComment" ("id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "authorId" TEXT NOT NULL, "content" TEXT NOT NULL, "visibility" "CommentVisibility" NOT NULL DEFAULT 'REQUESTER_VISIBLE', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id"))`,
    `CREATE TABLE IF NOT EXISTS "SupportDelivery" ("id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "recorderId" TEXT NOT NULL, "summary" TEXT NOT NULL, "actualOutcome" TEXT NOT NULL, "evidenceLinks" JSONB NOT NULL DEFAULT '[]', "deliveryDate" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SupportDelivery_pkey" PRIMARY KEY ("id"))`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SupportDelivery_requestId_key" ON "SupportDelivery"("requestId")`,
    `CREATE TABLE IF NOT EXISTS "SupportFeedback" ("id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "authorId" TEXT NOT NULL, "rating" INTEGER NOT NULL, "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SupportFeedback_pkey" PRIMARY KEY ("id"))`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SupportFeedback_requestId_key" ON "SupportFeedback"("requestId")`,
    `ALTER TABLE "InnovationProjectMember" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'MEMBER'`,
    `ALTER TABLE "SupportAssignment" ADD COLUMN IF NOT EXISTS "requestId" TEXT`,
    `ALTER TABLE "SupportAssignment" ADD COLUMN IF NOT EXISTS "ownerId" TEXT`,
    `ALTER TABLE "SupportAssignment" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ASSIGNED'`,
    `ALTER TABLE "SupportAssignment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "SupportAssignment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "RequestComment" ADD COLUMN IF NOT EXISTS "requestId" TEXT`,
    `ALTER TABLE "RequestComment" ADD COLUMN IF NOT EXISTS "authorId" TEXT`,
    `ALTER TABLE "RequestComment" ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "RequestComment" ADD COLUMN IF NOT EXISTS "visibility" "CommentVisibility" NOT NULL DEFAULT 'REQUESTER_VISIBLE'`,
    `ALTER TABLE "RequestComment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "RequestComment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "requestId" TEXT`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "recorderId" TEXT`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "summary" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "actualOutcome" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "evidenceLinks" JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "SupportDelivery" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "SupportFeedback" ADD COLUMN IF NOT EXISTS "requestId" TEXT`,
    `ALTER TABLE "SupportFeedback" ADD COLUMN IF NOT EXISTS "authorId" TEXT`,
    `ALTER TABLE "SupportFeedback" ADD COLUMN IF NOT EXISTS "rating" INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE "SupportFeedback" ADD COLUMN IF NOT EXISTS "comment" TEXT`,
    `ALTER TABLE "SupportFeedback" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "SupportFeedback" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
  ];

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/(already exists|duplicate key|does not exist)/i.test(message)) throw error;
    }
  }

  await prisma.$disconnect();
}

void main();
