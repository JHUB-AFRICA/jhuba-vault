import { RequestStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
export async function markOverdueRequests(now = new Date()): Promise<number> { const result = await prisma.assetRequest.updateMany({ where: { status: RequestStatus.CHECKED_OUT, expectedReturn: { lt: now } }, data: { status: RequestStatus.OVERDUE } }); return result.count; }
