import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listPublic() {
    const rows = await this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return rows.map((row) => ({
      key: row.key,
      isEnabled: row.isEnabled,
      description: row.description,
      updatedAt: row.updatedAt,
    }));
  }

  async getPublicByKey(key: string) {
    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!row) {
      throw new NotFoundException(`Feature flag not found: ${key}`);
    }
    return {
      key: row.key,
      isEnabled: row.isEnabled,
      description: row.description,
      updatedAt: row.updatedAt,
    };
  }

  async listAdmin() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertAdmin(
    actorId: string,
    input: {
      key: string;
      isEnabled: boolean;
      description?: string | null;
      rulesJson?: unknown;
    },
  ) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: input.key },
    });

    const row = await this.prisma.featureFlag.upsert({
      where: { key: input.key },
      update: {
        isEnabled: input.isEnabled,
        description: input.description === undefined ? undefined : input.description,
        rulesJson:
          input.rulesJson === undefined ? undefined : (input.rulesJson as Prisma.InputJsonValue),
      },
      create: {
        key: input.key,
        isEnabled: input.isEnabled,
        description: input.description ?? null,
        rulesJson:
          input.rulesJson === undefined ? undefined : (input.rulesJson as Prisma.InputJsonValue),
      },
    });

    await this.audit.record({
      actorId,
      action: existing ? 'feature_flag.update' : 'feature_flag.create',
      entityType: 'feature_flag',
      entityId: row.id,
      before: existing,
      after: row,
    });

    return row;
  }
}
