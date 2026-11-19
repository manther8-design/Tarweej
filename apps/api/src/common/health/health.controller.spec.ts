import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { RedisService } from '../../infrastructure/redis/redis.service';

describe('HealthController', () => {
  it('returns live status', () => {
    const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
    const redis = {
      isReady: () => false,
      ping: jest.fn(),
    } as unknown as RedisService;
    const controller = new HealthController(prisma, redis);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ready when database and redis respond', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const redis = {
      isReady: () => true,
      ping: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService;
    const controller = new HealthController(prisma, redis);
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      database: 'connected',
      redis: 'connected',
    });
  });

  it('returns 503 when database is down', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('db down')),
    } as unknown as PrismaService;
    const redis = {
      isReady: () => true,
      ping: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService;
    const controller = new HealthController(prisma, redis);
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns 503 when redis is down', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const redis = {
      isReady: () => false,
      ping: jest.fn().mockRejectedValue(new Error('redis down')),
    } as unknown as RedisService;
    const controller = new HealthController(prisma, redis);
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
