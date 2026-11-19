import { HealthController } from './health.controller';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { RedisService } from '../../infrastructure/redis/redis.service';

describe('HealthController', () => {
  const redis = { isReady: () => false } as unknown as RedisService;

  it('returns live status', () => {
    const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
    const controller = new HealthController(prisma, redis);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ready status when database responds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma, redis);
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      database: 'connected',
      redis: 'unavailable',
    });
  });
});
