import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { AuthResult } from '../domain/identity.types';
import { GOOGLE_AUTH_PROVIDER, type GoogleAuthPort } from '../domain/ports/google-auth.port';
import { Inject } from '@nestjs/common';
import { hashPassword, verifyPassword } from './crypto.util';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    @Inject(GOOGLE_AUTH_PROVIDER) private readonly googleAuth: GoogleAuthPort,
  ) {}

  async register(input: {
    email: string;
    password: string;
    displayName?: string;
    preferredLanguageCode?: string;
    deviceLabel?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password || input.password.length < 8) {
      throw new BadRequestException('Email and password (min 8 chars) are required');
    }

    const existing = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const rounds = this.config.getOrThrow<number>('identity.bcryptRounds');
    const passwordHash = await hashPassword(input.password, rounds);

    const userRole = await this.prisma.role.findUnique({ where: { code: 'user' } });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: input.displayName?.trim() || null,
        preferredLanguageCode: input.preferredLanguageCode ?? 'ar',
        accountType: 'regular',
        status: 'active',
        roleAssignments: userRole
          ? {
              create: { roleId: userRole.id },
            }
          : undefined,
      },
      include: {
        roleAssignments: { include: { role: true } },
      },
    });

    return this.issueSession(user, {
      deviceLabel: input.deviceLabel,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });
  }

  async login(input: {
    email: string;
    password: string;
    deviceLabel?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { roleAssignments: { include: { role: true } } },
    });

    if (!user?.passwordHash || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user, {
      deviceLabel: input.deviceLabel,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });
  }

  async refresh(input: {
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    const hash = this.tokens.hashRefreshToken(input.refreshToken);
    const session = await this.prisma.userSession.findFirst({
      where: {
        refreshTokenHash: hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { roleAssignments: { include: { role: true } } },
        },
      },
    });

    if (!session || session.user.deletedAt || session.user.status !== 'active') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate refresh token on the same session row.
    const rotated = this.tokens.mintRefreshToken();
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: rotated.hash,
        expiresAt: rotated.expiresAt,
        lastSeenAt: new Date(),
        userAgent: input.userAgent ?? session.userAgent,
        ipAddress: input.ipAddress ?? session.ipAddress,
      },
    });

    const roles = session.user.roleAssignments.map((a) => a.role.code);
    const tokens = await this.tokens.buildTokenPair({
      userId: session.user.id,
      sessionId: session.id,
      roles,
      refreshToken: rotated.token,
    });

    return {
      sessionId: session.id,
      tokens,
      user: this.toPublicUser(session.user, roles),
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async loginWithGoogle(input: {
    idToken: string;
    deviceLabel?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    const profile = await this.googleAuth.verifyIdToken(input.idToken);

    const existingLink = await this.prisma.userOauthAccount.findUnique({
      where: {
        provider_providerSubject: {
          provider: 'google',
          providerSubject: profile.subject,
        },
      },
      include: {
        user: { include: { roleAssignments: { include: { role: true } } } },
      },
    });

    if (existingLink) {
      if (existingLink.user.deletedAt || existingLink.user.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }
      return this.issueSession(existingLink.user, input);
    }

    const email = profile.email?.toLowerCase() ?? null;
    let user =
      email === null
        ? null
        : await this.prisma.user.findFirst({
            where: { email, deletedAt: null },
            include: { roleAssignments: { include: { role: true } } },
          });

    const userRole = await this.prisma.role.findUnique({ where: { code: 'user' } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: profile.displayName,
          emailVerifiedAt: profile.emailVerified ? new Date() : null,
          accountType: 'regular',
          status: 'active',
          preferredLanguageCode: 'ar',
          oauthAccounts: {
            create: {
              provider: 'google',
              providerSubject: profile.subject,
            },
          },
          roleAssignments: userRole
            ? {
                create: { roleId: userRole.id },
              }
            : undefined,
        },
        include: { roleAssignments: { include: { role: true } } },
      });
    } else {
      await this.prisma.userOauthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerSubject: profile.subject,
        },
      });
      if (profile.emailVerified && !user.emailVerifiedAt) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
          include: { roleAssignments: { include: { role: true } } },
        });
      }
    }

    return this.issueSession(user, input);
  }

  private async issueSession(
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
      user: this.toPublicUser(user, roles),
    };
  }

  private toPublicUser(
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
    },
    roles: string[],
  ) {
    return {
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
    };
  }
}
