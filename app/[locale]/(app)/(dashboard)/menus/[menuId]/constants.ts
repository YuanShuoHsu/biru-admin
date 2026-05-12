export const FILTER_FIELDS = ["name", "description"] as const;
export const FILTER_OPERATORS = [
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "not_in",
  "contains",
  "starts_with",
  "ends_with",
] as const;

export const SEARCH_FIELDS = ["name", "description"] as const;
export const SEARCH_OPERATORS = [
  "contains",
  "starts_with",
  "ends_with",
] as const;

export const SORT_BY_FIELDS = ["name", "createdAt", "updatedAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
