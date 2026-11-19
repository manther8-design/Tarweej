import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listPublic() {
    const rows = await this.prisma.businessSetting.findMany({
      where: { isSecret: false },
      orderBy: { key: 'asc' },
    });
    return rows.map((row) => this.mapPublic(row));
  }

  async getPublicByKey(key: string) {
    const row = await this.prisma.businessSetting.findFirst({
      where: { key, isSecret: false },
    });
    if (!row) {
      throw new NotFoundException(`Setting not found: ${key}`);
    }
    return this.mapPublic(row);
  }

  async listAdmin() {
    return this.prisma.businessSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertAdmin(
    actorId: string,
    input: {
      key: string;
      valueJson: unknown;
      description?: string | null;
      isSecret?: boolean;
    },
  ) {
    const existing = await this.prisma.businessSetting.findUnique({
      where: { key: input.key },
    });

    const row = await this.prisma.businessSetting.upsert({
      where: { key: input.key },
      update: {
        valueJson: input.valueJson as Prisma.InputJsonValue,
        description: input.description === undefined ? undefined : input.description,
        isSecret: input.isSecret,
      },
      create: {
        key: input.key,
        valueJson: input.valueJson as Prisma.InputJsonValue,
        description: input.description ?? null,
        isSecret: input.isSecret ?? false,
      },
    });

    await this.audit.record({
      actorId,
      action: existing ? 'setting.update' : 'setting.create',
      entityType: 'business_setting',
      entityId: row.id,
      before: existing,
      after: row,
    });

    return row;
  }

  private mapPublic(row: {
    key: string;
    valueJson: Prisma.JsonValue;
    description: string | null;
    updatedAt: Date;
  }) {
    return {
      key: row.key,
      value: row.valueJson,
      description: row.description,
      updatedAt: row.updatedAt,
    };
  }
}
