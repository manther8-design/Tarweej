import { MetricsController } from './metrics.controller';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { RedisService } from '../../infrastructure/redis/redis.service';

describe('MetricsController', () => {
  it('emits prometheus gauges for process and dependencies', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const redis = { isReady: () => true } as unknown as RedisService;
    const controller = new MetricsController(prisma, redis);
    const body = await controller.metrics();
    expect(body).toContain('tarweej_process_uptime_seconds');
    expect(body).toContain('tarweej_dependency_up{dependency="postgres"} 1');
    expect(body).toContain('tarweej_dependency_up{dependency="redis"} 1');
  });

  it('marks postgres down when query fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('db')),
    } as unknown as PrismaService;
    const redis = { isReady: () => false } as unknown as RedisService;
    const controller = new MetricsController(prisma, redis);
    const body = await controller.metrics();
    expect(body).toContain('tarweej_dependency_up{dependency="postgres"} 0');
    expect(body).toContain('tarweej_dependency_up{dependency="redis"} 0');
  });
});
