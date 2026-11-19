import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import type { SearchCachePort } from '../../domain/search.types';

@Injectable()
export class RedisSearchCacheAdapter implements SearchCachePort {
  private readonly logger = new Logger(RedisSearchCacheAdapter.name);

  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    const client = this.redis.getClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch (err) {
      this.logger.warn(`cache get failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    try {
      await client.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`cache set failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
