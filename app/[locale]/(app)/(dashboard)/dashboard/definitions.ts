export const DASHBOARD_RANGES = {
  today: {
    bucketUnit: "hour",
    bucketSize: 1,
    buckets: 24,
    offsetDays: 0,
    tickStep: 3,
  },
  yesterday: {
    bucketUnit: "hour",
    bucketSize: 1,
    buckets: 24,
    offsetDays: 1,
    tickStep: 3,
  },
  "7d": {
    bucketUnit: "day",
    bucketSize: 1,
    buckets: 7,
    offsetDays: 0,
    tickStep: 1,
  },
  "30d": {
    bucketUnit: "day",
    bucketSize: 1,
    buckets: 30,
    offsetDays: 0,
    tickStep: 5,
  },
  "90d": {
    bucketUnit: "month",
    bucketSize: 1,
    buckets: 3,
    offsetDays: 0,
    tickStep: 1,
  },
  "365d": {
    bucketUnit: "month",
    bucketSize: 1,
    buckets: 12,
    offsetDays: 0,
    tickStep: 2,
  },
} as const;

export type DashboardRange = keyof typeof DASHBOARD_RANGES;

const DEFAULT_DASHBOARD_RANGE: DashboardRange = "30d";

const isDashboardRange = (value: string): value is DashboardRange =>
  value in DASHBOARD_RANGES;

export const resolveDashboardRange = (value?: string): DashboardRange =>
  value && isDashboardRange(value) ? value : DEFAULT_DASHBOARD_RANGE;
