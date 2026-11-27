import { Asset, Prisma, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errors';
import { requestSchema } from '../validators/schemas';
import { audit } from './audit.service';
import { markOverdueRequests } from './overdue.service';

export async function getRequestStatus(id: string): Promise<RequestStatus | null> {
  const request = await prisma.assetRequest.findUnique({ where: { id }, select: { status: true } });
  return request?.status ?? null;
}

export const includeRequest = {
  innovator: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      identificationId: true,
      department: true,
      role: true
    }
  },
  teamMembers: true,
  requestItems: { include: { asset: true } }
} satisfies Prisma.AssetRequestInclude;

export interface InnovatorRequestFilters {
  page: number;
  limit: number;
  status?: RequestStatus;
  dateFrom?: string;
  dateTo?: string;
}

export async function listInnovatorRequests(userId: string, filters: InnovatorRequestFilters) {
  await markOverdueRequests();
  const where: Prisma.AssetRequestWhereInput = {
    innovatorId: userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.dateFrom || filters.dateTo ? {
      createdAt: {
        ...(filters.dateFrom ? { gte: new Date(`${filters.dateFrom}T00:00:00.000Z`) } : {}),
        ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {})
      }
    } : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.assetRequest.findMany({
      where,
      include: includeRequest,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    }),
    prisma.assetRequest.count({ where })
  ]);
  return { items, total };
}

export function getRequestForInnovator(id: string, innovatorId: string) {
  return prisma.assetRequest.findFirst({
    where: { id, innovatorId },
    include: includeRequest
  });
}

export function getRequestById(id: string) {
  return prisma.assetRequest.findUnique({ where: { id }, include: includeRequest });
}

type RequestInput = ReturnType<typeof requestSchema.parse>;
type AssetReader = {
  asset: {
    findMany(args: { where: { id: { in: string[] } } }): Promise<Array<Pick<Asset, 'id' | 'name' | 'availableQty'>>>;
  };
};

export async function assertRequestAssetsAvailable(input: RequestInput, db: AssetReader): Promise<void> {
  const assetIds = input.items.map(item => item.assetId);
  if (new Set(assetIds).size !== assetIds.length) {
    throw new HttpError(422, 'DUPLICATE_ASSET', 'Each asset may only appear once in a request');
  }

  const assets = await db.asset.findMany({ where: { id: { in: assetIds } } });
  if (assets.length !== input.items.length) {
    throw new HttpError(404, 'ASSET_NOT_FOUND', 'One or more assets were not found');
  }
  for (const item of input.items) {
    const asset = assets.find(candidate => candidate.id === item.assetId)!;
    if (item.quantity > asset.availableQty) {
      throw new HttpError(409, 'INSUFFICIENT_INVENTORY', `Insufficient inventory for ${asset.name}`);
    }
  }
}

export async function prepareRequestForInnovator(input: RequestInput): Promise<void> {
  await assertRequestAssetsAvailable(input, prisma);
}

export async function createRequestForInnovator(
  input: RequestInput,
  innovatorId: string,
  actorId?: string
) {
  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);
  const expectedReturn = new Date(startDate);
  expectedReturn.setDate(expectedReturn.getDate() + input.loanDays);

  return prisma.$transaction(async tx => {
    const innovator = await tx.user.findUnique({
      where: { id: innovatorId },
      select: { id: true, role: true }
    });
    if (!innovator || innovator.role !== Role.INNOVATOR) {
      throw new HttpError(404, 'INNOVATOR_NOT_FOUND', 'Innovator not found');
    }

    await assertRequestAssetsAvailable(input, tx);
    const created = await tx.assetRequest.create({
      data: {
        projectName: input.projectName,
        projectAbstract: input.projectAbstract,
        loanDays: input.loanDays,
        startDate,
        expectedReturn,
        innovatorId,
        teamMembers: { create: input.teamMembers },
        requestItems: { create: input.items }
      },
      include: {
        innovator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            identificationId: true,
            department: true,
            role: true
          }
        },
        teamMembers: true,
        requestItems: { include: { asset: true } }
      }
    });
    if (actorId) {
      await audit(tx, actorId, 'ADMIN_REQUEST_CREATED', 'AssetRequest', created.id, { innovatorId });
    }
    return created;
  });
}
