import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { RedisSearchCacheAdapter } from './adapters/cache/redis-search-cache.adapter';
import { SearchController } from './adapters/http/search.controller';
import { PostgresSearchEngine } from './adapters/persistence/postgres-search.engine';
import { SearchService } from './application/search.service';
import { SEARCH_CACHE_PORT, SEARCH_ENGINE_PORT } from './domain/search.types';

/**
 * Search bounded context (TRW-008).
 * Public: `GET /api/v1/search/listings`
 * Engine: Postgres FTS/trigram (+ Redis cache). OpenSearch later via SearchEngine port.
 */
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    PostgresSearchEngine,
    RedisSearchCacheAdapter,
    { provide: SEARCH_ENGINE_PORT, useExisting: PostgresSearchEngine },
    { provide: SEARCH_CACHE_PORT, useExisting: RedisSearchCacheAdapter },
  ],
  exports: [SearchService],
})
export class SearchModule {}
