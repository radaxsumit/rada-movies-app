export const REPORT_REASONS = ["Spam or advertising", "Unmarked spoilers", "Harassment or hate", "Other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
