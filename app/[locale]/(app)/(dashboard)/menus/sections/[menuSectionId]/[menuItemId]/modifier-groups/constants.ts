export const STRING_FILTER_FIELDS = ["displayName"] as const;
export const DATE_FILTER_FIELDS = ["createdAt", "updatedAt"] as const;
export const FILTER_FIELDS = [
  ...STRING_FILTER_FIELDS,
  ...DATE_FILTER_FIELDS,
] as const;

export const SORT_BY_FIELDS = [
  "displayName",
  "createdAt",
  "updatedAt",
] as const;
