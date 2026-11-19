import { plainToInstance, Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

const DEV_ACCESS = 'dev-access-secret-change-me';
const DEV_REFRESH = 'dev-refresh-secret-change-me';
const WEAK_SECRETS = new Set([
  DEV_ACCESS,
  DEV_REFRESH,
  'ci-access-secret',
  'ci-refresh-secret',
  'change-me',
  'secret',
  'password',
]);

class EnvironmentVariables {
  @IsIn(['development', 'test', 'staging', 'production'])
  NODE_ENV = 'development';

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 3000;
    }
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : 3000;
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_AUTH_ENABLED?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  SMS_PROVIDER?: string;

  @IsOptional()
  @IsString()
  ALLOW_MOCK_PROVIDERS?: string;
}

function assertProductionSecrets(env: EnvironmentVariables): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const access = env.JWT_ACCESS_SECRET ?? '';
  const refresh = env.JWT_REFRESH_SECRET ?? '';

  if (!access || access.length < 32 || WEAK_SECRETS.has(access)) {
    throw new Error(
      'Environment validation failed: production requires a strong JWT_ACCESS_SECRET (min 32 chars, not a placeholder)',
    );
  }
  if (!refresh || refresh.length < 32 || WEAK_SECRETS.has(refresh)) {
    throw new Error(
      'Environment validation failed: production requires a strong JWT_REFRESH_SECRET (min 32 chars, not a placeholder)',
    );
  }
  if (access === refresh) {
    throw new Error(
      'Environment validation failed: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ in production',
    );
  }

  const allowMocks = (env.ALLOW_MOCK_PROVIDERS ?? '').toLowerCase() === 'true';
  const sms = (env.SMS_PROVIDER ?? 'mock').toLowerCase();
  if (!allowMocks && sms === 'mock') {
    throw new Error(
      'Environment validation failed: SMS_PROVIDER=mock is not allowed in production (set a real provider or ALLOW_MOCK_PROVIDERS=true for break-glass)',
    );
  }
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  assertProductionSecrets(validated);
  return validated;
}
