import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { AuthResult } from '../domain/identity.types';
import { SMS_PROVIDER, type SmsProviderPort } from '../domain/ports/sms-provider.port';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from './crypto.util';
import { TokenService } from './token.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tokens: TokenService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProviderPort,
  ) {}

  async requestOtp(input: {
    phoneE164: string;
    purpose?: string;
  }): Promise<{ challengeId: string; expiresIn: number; provider: string }> {
    const phone = normalizePhone(input.phoneE164);
    const purpose = input.purpose ?? 'login';
    const windowSeconds = this.config.getOrThrow<number>('identity.otpRateLimitWindowSeconds');
    const maxPerWindow = this.config.getOrThrow<number>('identity.otpRateLimitMax');
    const since = new Date(Date.now() - windowSeconds * 1000);

    const recentCount = await this.prisma.phoneOtpChallenge.count({
      where: {
        phoneE164: phone,
        purpose,
        createdAt: { gte: since },
      },
    });

    if (recentCount >= maxPerWindow) {
      throw new HttpException(
        'OTP rate limit exceeded; try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ttl = this.config.getOrThrow<number>('identity.otpTtlSeconds');
    const maxAttempts = this.config.getOrThrow<number>('identity.otpMaxAttempts');
    const length = this.config.getOrThrow<number>('identity.otpCodeLength');
    const code = generateOtpCode(length);
    const codeHash = await hashOtpCode(code);

    const challenge = await this.prisma.phoneOtpChallenge.create({
      data: {
        phoneE164: phone,
        codeHash,
        purpose,
        maxAttempts,
        expiresAt: new Date(Date.now() + ttl * 1000),
        lastSentAt: new Date(),
      },
    });

    await this.sms.send({
      toE164: phone,
      body: `Tarweej verification code: ${code}`,
    });

    return {
      challengeId: challenge.id,
      expiresIn: ttl,
      provider: this.sms.name,
    };
  }

  async verifyOtp(input: {
    phoneE164: string;
    code: string;
    purpose?: string;
    deviceLabel?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    const phone = normalizePhone(input.phoneE164);
    const purpose = input.purpose ?? 'login';

    const challenge = await this.prisma.phoneOtpChallenge.findFirst({
      where: {
        phoneE164: phone,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new UnauthorizedException('OTP expired or not found');
    }

    if (challenge.attemptCount >= challenge.maxAttempts) {
      throw new HttpException('OTP attempt limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    const valid = await verifyOtpCode(input.code, challenge.codeHash);
    await this.prisma.phoneOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        attemptCount: { increment: 1 },
        consumedAt: valid ? new Date() : undefined,
      },
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    let user = await this.prisma.user.findFirst({
      where: { phoneE164: phone, deletedAt: null },
      include: { roleAssignments: { include: { role: true } } },
    });

    if (!user) {
      const userRole = await this.prisma.role.findUnique({ where: { code: 'user' } });
      user = await this.prisma.user.create({
        data: {
          phoneE164: phone,
          phoneVerifiedAt: new Date(),
          accountType: 'regular',
          status: 'active',
          preferredLanguageCode: 'ar',
          roleAssignments: userRole
            ? {
                create: { roleId: userRole.id },
              }
            : undefined,
        },
        include: { roleAssignments: { include: { role: true } } },
      });
    } else if (!user.phoneVerifiedAt) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
        include: { roleAssignments: { include: { role: true } } },
      });
    }

    // Reuse session issuance via a lightweight internal path.
    return this.issueForUser(user, input);
  }

  private async issueForUser(
    user: {
      id: string;
      email: string | null;
      phoneE164: string | null;
      displayName: string | null;
      accountType: string;
      status: string;
      preferredLanguageCode: string | null;
      countryId: string | null;
      emailVerifiedAt: Date | null;
      phoneVerifiedAt: Date | null;
      roleAssignments: Array<{ role: { code: string } }>;
    },
    meta: { deviceLabel?: string; userAgent?: string; ipAddress?: string },
  ): Promise<AuthResult> {
    const roles = user.roleAssignments.map((a) => a.role.code);
    const refresh = this.tokens.mintRefreshToken();
    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: refresh.hash,
        deviceLabel: meta.deviceLabel ?? null,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
        expiresAt: refresh.expiresAt,
        lastSeenAt: new Date(),
      },
    });

    const tokens = await this.tokens.buildTokenPair({
      userId: user.id,
      sessionId: session.id,
      roles,
      refreshToken: refresh.token,
    });

    return {
      sessionId: session.id,
      tokens,
      user: {
        id: user.id,
        email: user.email,
        phoneE164: user.phoneE164,
        displayName: user.displayName,
        accountType: user.accountType,
        status: user.status,
        preferredLanguageCode: user.preferredLanguageCode,
        countryId: user.countryId,
        emailVerifiedAt: user.emailVerifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        roles,
      },
    };
  }
}

function normalizePhone(raw: string): string {
  const trimmed = raw.trim().replace(/[\s-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) {
    throw new BadRequestException('phoneE164 must be E.164 (e.g. +9665xxxxxxx)');
  }
  return trimmed;
}
