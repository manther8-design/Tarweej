import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

/**
 * Minimal Prometheus-compatible scrape surface for single-region v1.
 * Intentionally process-local (no business metrics yet).
 */
@ApiTags('ops')
@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus text metrics (process + dependency flags)' })
  async metrics(): Promise<string> {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    let dbUp = 0;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbUp = 1;
    } catch {
      dbUp = 0;
    }
    const redisUp = this.redis.isReady() ? 1 : 0;

    const lines = [
      '# HELP tarweej_process_uptime_seconds Process uptime in seconds',
      '# TYPE tarweej_process_uptime_seconds gauge',
      `tarweej_process_uptime_seconds ${uptime.toFixed(3)}`,
      '# HELP tarweej_process_resident_memory_bytes Resident set size',
      '# TYPE tarweej_process_resident_memory_bytes gauge',
      `tarweej_process_resident_memory_bytes ${mem.rss}`,
      '# HELP tarweej_process_heap_used_bytes Heap used bytes',
      '# TYPE tarweej_process_heap_used_bytes gauge',
      `tarweej_process_heap_used_bytes ${mem.heapUsed}`,
      '# HELP tarweej_dependency_up Dependency liveness (1=up, 0=down)',
      '# TYPE tarweej_dependency_up gauge',
      `tarweej_dependency_up{dependency="postgres"} ${dbUp}`,
      `tarweej_dependency_up{dependency="redis"} ${redisUp}`,
      '',
    ];
    return lines.join('\n');
  }
}
