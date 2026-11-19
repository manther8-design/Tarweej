/**
 * Moderation reports (TRW-011) — owned by Engagement context.
 */

export const REPORT_STATUSES = ['open', 'in_review', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_REASON_CODES = [
  'spam',
  'fraud',
  'inappropriate',
  'counterfeit',
  'harassment',
  'other',
] as const;
export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];

export const REPORT_CLASSIFICATIONS = [
  'spam',
  'policy_violation',
  'fraud',
  'duplicate',
  'legitimate',
  'unclear',
] as const;
export type ReportClassification = (typeof REPORT_CLASSIFICATIONS)[number];

export const REPORT_ACTIONS = ['hide_listing', 'none'] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];

export const REPORT_CLOSE_STATUSES = ['resolved', 'dismissed'] as const;
export type ReportCloseStatus = (typeof REPORT_CLOSE_STATUSES)[number];
