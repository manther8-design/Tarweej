import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { roleAssignments: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.map(user);
  }

  async updateProfile(
    userId: string,
    input: {
      displayName?: string;
      preferredLanguageCode?: string;
      countryId?: string | null;
    },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName === undefined ? undefined : input.displayName.trim() || null,
        preferredLanguageCode: input.preferredLanguageCode,
        countryId: input.countryId === undefined ? undefined : input.countryId,
      },
      include: { roleAssignments: { include: { role: true } } },
    });

    return this.map(user);
  }

  private map(user: {
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
    createdAt: Date;
    updatedAt: Date;
    roleAssignments: Array<{ role: { code: string; name: string } }>;
  }) {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roleAssignments.map((a) => a.role.code),
    };
  }
}
