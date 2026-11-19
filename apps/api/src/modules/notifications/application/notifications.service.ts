import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  DEVICE_PLATFORMS,
  NOTIFICATION_CHANNELS,
  PUSH_PROVIDER_PORT,
  type CreateNotificationInput,
  type DevicePlatform,
  type NotificationChannel,
  type PushProviderPort,
} from '../domain/notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER_PORT) private readonly push: PushProviderPort,
  ) {}

  /**
   * Persist an in-app notification and best-effort push via registered device tokens.
   */
  async notify(input: CreateNotificationInput) {
    const channel: NotificationChannel = input.channel ?? 'in_app';
    if (!NOTIFICATION_CHANNELS.includes(channel)) {
      throw new BadRequestException(`Unsupported notification channel: ${channel}`);
    }

    const payload = (input.payload ?? {}) as Prisma.InputJsonValue;
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        channel,
        templateCode: input.templateCode,
        payload,
      },
    });

    const title = input.title ?? this.defaultTitle(input.templateCode);
    const body = input.body ?? this.defaultBody(input.templateCode, input.payload ?? {});

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: input.userId },
      select: { token: true },
    });
    if (tokens.length > 0) {
      await this.push.send({
        tokens: tokens.map((t) => t.token),
        message: {
          title,
          body,
          data: {
            notificationId: row.id,
            templateCode: input.templateCode,
          },
        },
      });
    }

    return this.toDto(row);
  }

  async list(
    userId: string,
    input: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
  ) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(input.unreadOnly ? { readAt: null } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => this.toDto(row)),
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount: count };
  }

  async markRead(userId: string, notificationId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!row) {
      throw new NotFoundException(`Notification not found: ${notificationId}`);
    }
    if (row.readAt) {
      return this.toDto(row);
    }
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return this.toDto(updated);
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { markedRead: result.count };
  }

  async registerDeviceToken(userId: string, input: { token: string; platform: string }) {
    const token = input.token.trim();
    if (!token) {
      throw new BadRequestException('Device token is required');
    }
    const platform = input.platform.trim().toLowerCase();
    if (!DEVICE_PLATFORMS.includes(platform as DevicePlatform)) {
      throw new BadRequestException(
        `Unsupported platform: ${input.platform}. Expected one of ${DEVICE_PLATFORMS.join(', ')}`,
      );
    }

    const existing = await this.prisma.deviceToken.findUnique({ where: { token } });
    if (existing && existing.userId !== userId) {
      // Token moved to a new account — reassign.
      const updated = await this.prisma.deviceToken.update({
        where: { token },
        data: { userId, platform, lastSeenAt: new Date() },
      });
      return this.toDeviceDto(updated);
    }

    const row = await this.prisma.deviceToken.upsert({
      where: { token },
      update: { platform, lastSeenAt: new Date(), userId },
      create: { userId, platform, token, lastSeenAt: new Date() },
    });
    return this.toDeviceDto(row);
  }

  async unregisterDeviceToken(userId: string, token: string) {
    const existing = await this.prisma.deviceToken.findUnique({ where: { token } });
    if (!existing || existing.userId !== userId) {
      return { removed: false };
    }
    await this.prisma.deviceToken.delete({ where: { token } });
    return { removed: true };
  }

  private defaultTitle(templateCode: string): string {
    switch (templateCode) {
      case 'listing.approved':
        return 'Listing approved';
      case 'listing.rejected':
        return 'Listing rejected';
      case 'payment.success':
        return 'Payment successful';
      case 'payment.failed':
        return 'Payment failed';
      case 'featured.expired':
        return 'Featured promotion ended';
      case 'message.new':
        return 'New message';
      default:
        return 'Tarweej notification';
    }
  }

  private defaultBody(templateCode: string, payload: Record<string, unknown>): string {
    switch (templateCode) {
      case 'listing.approved':
        return `Your listing "${String(payload['listingTitle'] ?? '')}" is now active.`;
      case 'listing.rejected':
        return `Your listing was rejected: ${String(payload['reason'] ?? 'see details')}`;
      case 'payment.success':
        return 'Your payment was confirmed.';
      case 'payment.failed':
        return `Payment failed: ${String(payload['failureReason'] ?? 'try again')}`;
      case 'featured.expired':
        return 'Your featured promotion has expired.';
      case 'message.new':
        return String(payload['preview'] ?? 'You have a new message.');
      default:
        return 'You have a new notification.';
    }
  }

  private toDto(row: {
    id: string;
    userId: string;
    channel: string;
    templateCode: string;
    payload: Prisma.JsonValue;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      channel: row.channel,
      templateCode: row.templateCode,
      payload: row.payload,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      isRead: Boolean(row.readAt),
    };
  }

  private toDeviceDto(row: {
    id: string;
    userId: string;
    platform: string;
    token: string;
    lastSeenAt: Date;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      platform: row.platform,
      token: row.token,
      lastSeenAt: row.lastSeenAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
