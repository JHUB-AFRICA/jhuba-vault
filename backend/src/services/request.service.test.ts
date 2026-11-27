import { describe, expect, it, vi } from 'vitest';
import { requestSchema } from '../validators/schemas';
import { assertRequestAssetsAvailable } from './request.service';

const request = requestSchema.parse({
  projectName: 'Soil monitor',
  projectAbstract: 'Building a monitor to measure soil moisture.',
  loanDays: 7,
  startDate: '2026-12-01',
  items: [{ assetId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
  teamMembers: []
});

describe('request asset availability validation', () => {
  it('rejects duplicate assets before request creation', async () => {
    const duplicateRequest = requestSchema.parse({
      ...request,
      items: [...request.items, ...request.items]
    });
    const findMany = vi.fn(async () => []);
    const db = { asset: { findMany } };

    await expect(assertRequestAssetsAvailable(duplicateRequest, db))
      .rejects.toMatchObject({ status: 422, code: 'DUPLICATE_ASSET' });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects requested quantities above live availability', async () => {
    const db = {
      asset: {
        findMany: async () => [{
          id: request.items[0].assetId,
          name: 'Laptop',
          availableQty: 1
        }]
      }
    };

    await expect(assertRequestAssetsAvailable({ ...request, items: [{ ...request.items[0], quantity: 2 }] }, db))
      .rejects.toMatchObject({ status: 409, code: 'INSUFFICIENT_INVENTORY' });
  });

  it('accepts a request within live availability', async () => {
    const db = {
      asset: {
        findMany: async () => [{
          id: request.items[0].assetId,
          name: 'Laptop',
          availableQty: 2
        }]
      }
    };

    await expect(assertRequestAssetsAvailable(request, db)).resolves.toBeUndefined();
  });
});
