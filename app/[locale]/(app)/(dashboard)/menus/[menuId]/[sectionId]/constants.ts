export const STRING_FILTER_FIELDS = ["name"] as const;
export const DATE_FILTER_FIELDS = ["createdAt", "updatedAt"] as const;
export const FILTER_FIELDS = [
  ...STRING_FILTER_FIELDS,
  ...DATE_FILTER_FIELDS,
] as const;

export const STRING_FILTER_OPERATORS = [
  "eq",
  "ne",
  "contains",
  "starts_with",
  "ends_with",
] as const;
export const DATE_FILTER_OPERATORS = ["eq", "ne", "lt", "lte", "gt", "gte"] as const;
export const FILTER_OPERATORS = [
  ...STRING_FILTER_OPERATORS,
  ...DATE_FILTER_OPERATORS,
] as const;

export const SEARCH_FIELDS = ["name", "description"] as const;
export const SEARCH_OPERATORS = [
  "contains",
  "starts_with",
  "ends_with",
] as const;

export const SORT_BY_FIELDS = ["name", "createdAt", "updatedAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
