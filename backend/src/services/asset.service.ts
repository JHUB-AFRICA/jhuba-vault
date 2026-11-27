import { Asset } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AssetListFilters {
  search?: string;
  category?: string;
  availability?: string;
  limit?: number;
}

export function listAssets(filters: AssetListFilters = {}): Promise<Asset[]> {
  return prisma.asset.findMany({
    where: {
      ...(filters.category ? { category: filters.category as never } : {}),
      ...(filters.availability === 'IN_STOCK' ? { availableQty: { gt: 0 } } :
        filters.availability === 'CHECKED_OUT' ? { availableQty: 0 } : {}),
      ...(filters.search ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { assetTag: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      } : {})
    },
    orderBy: { name: 'asc' },
    ...(filters.limit ? { take: filters.limit } : {})
  });
}
