import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    metadata?: unknown;
  }) {
    return this.prisma.auditEntry.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeJson:
          input.before === undefined ? undefined : (input.before as Prisma.InputJsonValue),
        afterJson: input.after === undefined ? undefined : (input.after as Prisma.InputJsonValue),
        metadata:
          input.metadata === undefined ? undefined : (input.metadata as Prisma.InputJsonValue),
      },
    });
  }

  async list(input: { entityType?: string; actorId?: string; limit?: number }) {
    const take = Math.min(Math.max(input.limit ?? 50, 1), 200);
    return this.prisma.auditEntry.findMany({
      where: {
        entityType: input.entityType,
        actorId: input.actorId,
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        actor: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });
  }
}
