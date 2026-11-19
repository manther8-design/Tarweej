import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => {
  const driver = (process.env.OBJECT_STORAGE_DRIVER ?? 'local').toLowerCase();
  return {
    driver: driver === 's3' ? 's3' : 'local',
    localRoot: process.env.OBJECT_STORAGE_LOCAL_ROOT ?? '.data/object-storage',
    publicBaseUrl:
      process.env.OBJECT_STORAGE_PUBLIC_BASE_URL ??
      process.env.CDN_BASE_URL ??
      'http://localhost:3000/api/v1/media',
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.S3_REGION ?? 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY ?? 'tarweej_minio',
      secretKey: process.env.S3_SECRET_KEY ?? 'tarweej_minio_dev_password',
      bucket: process.env.S3_BUCKET ?? 'tarweej-dev',
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() !== 'false',
    },
  };
});
