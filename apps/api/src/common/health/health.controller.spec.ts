import { HealthController } from './health.controller';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('HealthController', () => {
  it('returns live status', () => {
    const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
    const controller = new HealthController(prisma);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ready status when database responds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      database: 'connected',
    });
  });
});
