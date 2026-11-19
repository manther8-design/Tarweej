class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.templateCode,
    required this.channel,
    required this.payload,
    required this.isRead,
    required this.createdAt,
    this.readAt,
  });

  final String id;
  final String templateCode;
  final String channel;
  final Map<String, dynamic> payload;
  final bool isRead;
  final String createdAt;
  final String? readAt;

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    final payloadRaw = json['payload'];
    return NotificationItem(
      id: json['id'] as String,
      templateCode: json['templateCode'] as String? ?? '',
      channel: json['channel'] as String? ?? 'in_app',
      payload: payloadRaw is Map<String, dynamic>
          ? payloadRaw
          : <String, dynamic>{},
      isRead: json['isRead'] == true || json['readAt'] != null,
      createdAt: json['createdAt'] as String? ?? '',
      readAt: json['readAt'] as String?,
    );
  }

  String get titleHint {
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
        return 'Featured ended';
      case 'message.new':
        return 'New message';
      default:
        return templateCode;
    }
  }

  String get bodyHint {
    final listingTitle = payload['listingTitle']?.toString();
    final preview = payload['preview']?.toString();
    final reason = payload['reason']?.toString() ?? payload['failureReason']?.toString();
    if (preview != null && preview.isNotEmpty) {
      return preview;
    }
    if (listingTitle != null && listingTitle.isNotEmpty) {
      return listingTitle;
    }
    if (reason != null && reason.isNotEmpty) {
      return reason;
    }
    return templateCode;
  }
}

class NotificationPage {
  const NotificationPage({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  final List<NotificationItem> items;
  final int page;
  final int pageSize;
  final int total;

  factory NotificationPage.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
            .whereType<Map<String, dynamic>>()
            .map(NotificationItem.fromJson)
            .toList(growable: false)
        : const <NotificationItem>[];
    return NotificationPage(
      items: items,
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? 20,
      total: (json['total'] as num?)?.toInt() ?? items.length,
    );
  }
}
