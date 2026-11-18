import { registerAs } from '@nestjs/config';

export const identityConfig = registerAs('identity', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 30),
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
  otpRateLimitWindowSeconds: Number(process.env.OTP_RATE_LIMIT_WINDOW_SECONDS ?? 60),
  otpRateLimitMax: Number(process.env.OTP_RATE_LIMIT_MAX ?? 3),
  otpCodeLength: Number(process.env.OTP_CODE_LENGTH ?? 6),
  smsProvider: process.env.SMS_PROVIDER ?? 'mock',
  googleAuthEnabled: (process.env.GOOGLE_AUTH_ENABLED ?? 'false').toLowerCase() === 'true',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
}));
