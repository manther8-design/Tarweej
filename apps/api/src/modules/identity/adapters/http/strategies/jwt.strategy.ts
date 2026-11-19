import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { AuthenticatedUser } from '../../../domain/identity.types';
import type { AccessTokenPayload } from '../../../application/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('identity.jwtAccessSecret'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    if (payload.typ !== 'access' || !payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid access token');
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            roleAssignments: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.user.deletedAt || session.user.status !== 'active') {
      throw new UnauthorizedException('Session revoked or expired');
    }

    const roles = session.user.roleAssignments.map((a) => a.role.code);
    const permissions = [
      ...new Set(
        session.user.roleAssignments.flatMap((a) =>
          a.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      id: session.user.id,
      email: session.user.email,
      phoneE164: session.user.phoneE164,
      displayName: session.user.displayName,
      accountType: session.user.accountType,
      status: session.user.status,
      preferredLanguageCode: session.user.preferredLanguageCode,
      countryId: session.user.countryId,
      emailVerifiedAt: session.user.emailVerifiedAt,
      phoneVerifiedAt: session.user.phoneVerifiedAt,
      roles,
      permissions,
      sessionId: session.id,
    };
  }
}
