import 'reflect-metadata';
import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  const base = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://tarweej:x@localhost:5432/tarweej',
    REDIS_URL: 'redis://localhost:6379',
  };

  it('accepts development with defaults', () => {
    expect(() => validateEnvironment({ ...base })).not.toThrow();
  });

  it('rejects production with placeholder JWT secrets', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'dev-access-secret-change-me',
        JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
        SMS_PROVIDER: 'twilio',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects production with mock SMS unless break-glass is set', () => {
    const strong = 'a'.repeat(32);
    const strong2 = 'b'.repeat(32);
    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: strong,
        JWT_REFRESH_SECRET: strong2,
        SMS_PROVIDER: 'mock',
      }),
    ).toThrow(/SMS_PROVIDER=mock/);
  });

  it('accepts production with strong secrets and real SMS provider', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'prod-access-secret-value-32chars!!',
        JWT_REFRESH_SECRET: 'prod-refresh-secret-value-32chars!',
        SMS_PROVIDER: 'twilio',
      }),
    ).not.toThrow();
  });
});
