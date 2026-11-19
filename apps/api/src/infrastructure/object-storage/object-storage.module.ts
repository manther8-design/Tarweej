import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { storageConfig } from '../../common/config/storage.config';
import { OBJECT_STORAGE_PORT } from '../../modules/listings/domain/listings.types';
import { LocalObjectStorageAdapter } from './local-object-storage.adapter';
import { S3ObjectStorageAdapter } from './s3-object-storage.adapter';

@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [
    LocalObjectStorageAdapter,
    S3ObjectStorageAdapter,
    {
      provide: OBJECT_STORAGE_PORT,
      inject: [ConfigService, LocalObjectStorageAdapter, S3ObjectStorageAdapter],
      useFactory: (
        config: ConfigService,
        local: LocalObjectStorageAdapter,
        s3: S3ObjectStorageAdapter,
      ) => {
        const driver = config.get<string>('storage.driver') ?? 'local';
        return driver === 's3' ? s3 : local;
      },
    },
  ],
  exports: [OBJECT_STORAGE_PORT, LocalObjectStorageAdapter],
})
export class ObjectStorageModule {}
