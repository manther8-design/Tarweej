import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

export type HealthLiveResponse = { status: 'ok' };

export type HealthReadyResponse = {
  status: 'ready';
  database: 'connected';
  redis: 'connected';
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (process up)' })
  live(): HealthLiveResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — PostgreSQL + Redis must be reachable',
  })
  async ready(): Promise<HealthReadyResponse> {
    const checks: {
      database: 'connected' | 'disconnected';
      redis: 'connected' | 'disconnected';
    } = {
      database: 'disconnected',
      redis: 'disconnected',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'connected';
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        ...checks,
      });
    }

    try {
      await this.redis.ping();
      checks.redis = 'connected';
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        ...checks,
      });
    }

    return {
      status: 'ready',
      database: 'connected',
      redis: 'connected',
    };
  }
}
