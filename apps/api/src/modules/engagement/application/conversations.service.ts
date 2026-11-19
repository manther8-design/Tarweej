import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CHAT_REALTIME_PORT, type ChatRealtimePort } from '../domain/engagement.types';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CHAT_REALTIME_PORT) private readonly realtime: ChatRealtimePort,
  ) {}

  async openOrGet(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        status: true,
        title: true,
        deletedAt: true,
      },
    });
    if (!listing || listing.status === 'deleted') {
      throw new NotFoundException(`Listing not found: ${listingId}`);
    }
    if (listing.ownerId === userId) {
      throw new ForbiddenException('Cannot start a conversation on your own listing');
    }

    const sellerId = listing.ownerId;
    const existing = await this.prisma.conversation.findUnique({
      where: {
        listingId_buyerId_sellerId: {
          listingId,
          buyerId: userId,
          sellerId,
        },
      },
    });
    if (existing) {
      return this.toConversationDto(existing, userId, listing.title);
    }

    const created = await this.prisma.conversation.create({
      data: {
        listingId,
        buyerId: userId,
        sellerId,
      },
    });
    return this.toConversationDto(created, userId, listing.title);
  }

  async list(userId: string, input: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.ConversationWhereInput = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listing: { select: { id: true, title: true, status: true, deletedAt: true } },
          buyer: { select: { id: true, displayName: true } },
          seller: { select: { id: true, displayName: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
          },
        },
      }),
    ]);

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: rows.map((r) => r.id) },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    });
    const unreadByConversation = new Map(
      unreadCounts.map((row) => [row.conversationId, row._count._all]),
    );

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => {
        const last = row.messages[0] ?? null;
        return {
          id: row.id,
          listingId: row.listingId,
          listingTitle: row.listing.title,
          listingStatus: row.listing.status,
          listingUnavailable: Boolean(row.listing.deletedAt) || row.listing.status === 'deleted',
          buyerId: row.buyerId,
          sellerId: row.sellerId,
          counterparty:
            row.buyerId === userId
              ? { id: row.seller.id, displayName: row.seller.displayName }
              : { id: row.buyer.id, displayName: row.buyer.displayName },
          myRole: row.buyerId === userId ? 'buyer' : 'seller',
          lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
          lastMessage: last
            ? {
                id: last.id,
                body: last.body,
                senderId: last.senderId,
                createdAt: last.createdAt.toISOString(),
                readAt: last.readAt?.toISOString() ?? null,
              }
            : null,
          unreadCount: unreadByConversation.get(row.id) ?? 0,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    };
  }

  async get(userId: string, conversationId: string) {
    const conversation = await this.requireParticipant(userId, conversationId);
    const listing = await this.prisma.listing.findUnique({
      where: { id: conversation.listingId },
      select: { title: true, status: true, deletedAt: true },
    });
    return {
      ...this.toConversationDto(conversation, userId, listing?.title ?? null),
      listingStatus: listing?.status ?? null,
      listingUnavailable: Boolean(listing?.deletedAt) || listing?.status === 'deleted',
    };
  }

  async listMessages(
    userId: string,
    conversationId: string,
    input: { page?: number; pageSize?: number } = {},
  ) {
    await this.requireParticipant(userId, conversationId);
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 50, 1), 100);
    const where: Prisma.MessageWhereInput = { conversationId };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => this.toMessageDto(row)),
    };
  }

  async sendMessage(userId: string, conversationId: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new BadRequestException('Message body cannot be empty');
    }

    const conversation = await this.requireParticipant(userId, conversationId);
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          body: trimmed,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });

    const participants = [conversation.buyerId, conversation.sellerId];
    await this.realtime.notifyNewMessage(
      {
        conversationId,
        messageId: message.id,
        senderId: userId,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      },
      participants,
    );

    return this.toMessageDto(message);
  }

  async markRead(userId: string, conversationId: string) {
    await this.requireParticipant(userId, conversationId);
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { conversationId, markedRead: result.count };
  }

  private async requireParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${conversationId}`);
    }
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
    return conversation;
  }

  private toConversationDto(
    conversation: {
      id: string;
      listingId: string;
      buyerId: string;
      sellerId: string;
      lastMessageAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    userId: string,
    listingTitle: string | null,
  ) {
    return {
      id: conversation.id,
      listingId: conversation.listingId,
      listingTitle,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      myRole: conversation.buyerId === userId ? 'buyer' : 'seller',
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  private toMessageDto(message: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      readAt: message.readAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
