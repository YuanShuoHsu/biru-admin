export const FILTER_FIELDS = ["email", "name"] as const;
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

export const SEARCH_FIELDS = ["name", "email"] as const;
export const SEARCH_OPERATORS = [
  "contains",
  "starts_with",
  "ends_with",
] as const;

export const SORT_BY_FIELDS = ["name", "email", "role", "createdAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
