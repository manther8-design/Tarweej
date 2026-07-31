import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns liveness status', () => {
    const prisma = {
      $queryRaw: jest.fn(),
    };
    const controller = new HealthController(prisma as never);

    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('checks database readiness', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const controller = new HealthController(prisma as never);

    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      database: 'connected',
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
