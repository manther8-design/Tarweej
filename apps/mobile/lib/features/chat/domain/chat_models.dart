class ChatCounterparty {
  const ChatCounterparty({required this.id, this.displayName});

  final String id;
  final String? displayName;

  factory ChatCounterparty.fromJson(Map<String, dynamic> json) {
    return ChatCounterparty(
      id: json['id'] as String,
      displayName: json['displayName'] as String?,
    );
  }
}

class ChatLastMessage {
  const ChatLastMessage({
    required this.id,
    required this.body,
    required this.senderId,
    required this.createdAt,
    this.readAt,
  });

  final String id;
  final String body;
  final String senderId;
  final String createdAt;
  final String? readAt;

  factory ChatLastMessage.fromJson(Map<String, dynamic> json) {
    return ChatLastMessage(
      id: json['id'] as String,
      body: json['body'] as String? ?? '',
      senderId: json['senderId'] as String,
      createdAt: json['createdAt'] as String? ?? '',
      readAt: json['readAt'] as String?,
    );
  }
}

class ConversationSummary {
  const ConversationSummary({
    required this.id,
    required this.listingId,
    required this.listingTitle,
    required this.myRole,
    required this.unreadCount,
    required this.createdAt,
    this.listingStatus,
    this.listingUnavailable = false,
    this.counterparty,
    this.lastMessageAt,
    this.lastMessage,
  });

  final String id;
  final String listingId;
  final String listingTitle;
  final String? listingStatus;
  final bool listingUnavailable;
  final String myRole;
  final ChatCounterparty? counterparty;
  final String? lastMessageAt;
  final ChatLastMessage? lastMessage;
  final int unreadCount;
  final String createdAt;

  factory ConversationSummary.fromJson(Map<String, dynamic> json) {
    final counterparty = json['counterparty'];
    final lastMessage = json['lastMessage'];
    return ConversationSummary(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      listingTitle: json['listingTitle'] as String? ?? '',
      listingStatus: json['listingStatus'] as String?,
      listingUnavailable: json['listingUnavailable'] as bool? ?? false,
      myRole: json['myRole'] as String? ?? '',
      counterparty: counterparty is Map<String, dynamic>
          ? ChatCounterparty.fromJson(counterparty)
          : null,
      lastMessageAt: json['lastMessageAt'] as String?,
      lastMessage: lastMessage is Map<String, dynamic>
          ? ChatLastMessage.fromJson(lastMessage)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class ConversationPage {
  const ConversationPage({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.items,
  });

  final int page;
  final int pageSize;
  final int total;
  final List<ConversationSummary> items;

  factory ConversationPage.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return ConversationPage(
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 20,
      total: json['total'] as int? ?? 0,
      items: rawItems is List
          ? rawItems
              .whereType<Map<String, dynamic>>()
              .map(ConversationSummary.fromJson)
              .toList(growable: false)
          : const <ConversationSummary>[],
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    required this.createdAt,
    this.readAt,
  });

  final String id;
  final String conversationId;
  final String senderId;
  final String body;
  final String? readAt;
  final String createdAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      body: json['body'] as String? ?? '',
      readAt: json['readAt'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class ChatMessagePage {
  const ChatMessagePage({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.items,
  });

  final int page;
  final int pageSize;
  final int total;
  final List<ChatMessage> items;

  factory ChatMessagePage.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return ChatMessagePage(
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 50,
      total: json['total'] as int? ?? 0,
      items: rawItems is List
          ? rawItems
              .whereType<Map<String, dynamic>>()
              .map(ChatMessage.fromJson)
              .toList(growable: false)
          : const <ChatMessage>[],
    );
  }
}

class OpenedConversation {
  const OpenedConversation({
    required this.id,
    required this.listingId,
    required this.buyerId,
    required this.sellerId,
    required this.myRole,
  });

  final String id;
  final String listingId;
  final String buyerId;
  final String sellerId;
  final String myRole;

  factory OpenedConversation.fromJson(Map<String, dynamic> json) {
    return OpenedConversation(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      buyerId: json['buyerId'] as String,
      sellerId: json['sellerId'] as String,
      myRole: json['myRole'] as String? ?? '',
    );
  }
}
