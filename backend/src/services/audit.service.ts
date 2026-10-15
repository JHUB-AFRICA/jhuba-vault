import { Prisma, PrismaClient } from '@prisma/client';
export async function audit(db: PrismaClient | Prisma.TransactionClient, actorId: string | undefined, action: string, entityType: string, entityId: string, metadata?: Prisma.InputJsonValue): Promise<void> { await db.auditLog.create({ data: { actorId, action, entityType, entityId, metadata } }); }
