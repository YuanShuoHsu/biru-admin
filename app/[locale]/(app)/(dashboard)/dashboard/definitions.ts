export const DASHBOARD_RANGES = {
  today: {
    hourly: true,
    bucketDays: 1,
    buckets: 24,
    offsetDays: 0,
    tickStep: 3,
  },
  yesterday: {
    hourly: true,
    bucketDays: 1,
    buckets: 24,
    offsetDays: 1,
    tickStep: 3,
  },
  "7d": {
    hourly: false,
    bucketDays: 1,
    buckets: 7,
    offsetDays: 0,
    tickStep: 1,
  },
  "30d": {
    hourly: false,
    bucketDays: 1,
    buckets: 30,
    offsetDays: 0,
    tickStep: 5,
  },
  "90d": {
    hourly: false,
    bucketDays: 7,
    buckets: 13,
    offsetDays: 0,
    tickStep: 2,
  },
  "365d": {
    hourly: false,
    bucketDays: 30,
    buckets: 12,
    offsetDays: 0,
    tickStep: 2,
  },
} as const;

export type DashboardRange = keyof typeof DASHBOARD_RANGES;

export const DEFAULT_DASHBOARD_RANGE: DashboardRange = "30d";

const isDashboardRange = (value: string): value is DashboardRange =>
  value in DASHBOARD_RANGES;

export const resolveDashboardRange = (value?: string): DashboardRange =>
  value && isDashboardRange(value) ? value : DEFAULT_DASHBOARD_RANGE;
