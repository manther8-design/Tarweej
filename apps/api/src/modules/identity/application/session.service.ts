import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, currentSessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.id === currentSessionId) {
      throw new ForbiddenException('Use logout to revoke the current session');
    }
    if (session.revokedAt) {
      return { revoked: true, id: session.id };
    }
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return { revoked: true, id: session.id };
  }
}
