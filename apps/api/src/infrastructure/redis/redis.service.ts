import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Optional Redis client. Connection failures degrade to a disconnected state
 * so search/cache callers can fall through without crashing the API.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL') ?? process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set; Redis cache disabled');
      return;
    }

    try {
      const redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
      });
      redis.on('error', (err) => {
        this.ready = false;
        this.logger.warn(`Redis error: ${err.message}`);
      });
      redis.on('ready', () => {
        this.ready = true;
      });
      await redis.connect();
      this.client = redis;
      this.ready = true;
      this.logger.log('Redis connected');
    } catch (err) {
      this.ready = false;
      this.client = null;
      this.logger.warn(
        `Redis unavailable (${err instanceof Error ? err.message : String(err)}); cache disabled`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready && this.client != null;
  }

  getClient(): Redis | null {
    return this.isReady() ? this.client : null;
  }
}
