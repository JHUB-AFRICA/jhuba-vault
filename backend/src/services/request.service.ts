import { RequestStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
export async function getRequestStatus(id: string): Promise<RequestStatus | null> { const request = await prisma.assetRequest.findUnique({ where: { id }, select: { status: true } }); return request?.status ?? null; }
