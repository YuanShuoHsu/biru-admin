export const FILTER_FIELDS = ["email", "name"] as const;

export const STRING_FILTER_OPERATORS = [
  "contains",
  "doesNotContain",
  "equals",
  "doesNotEqual",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
] as const;

export const NO_VALUE_FILTER_OPERATORS: readonly string[] = [
  "isEmpty",
  "isNotEmpty",
];

export const FILTER_OPERATORS = [...STRING_FILTER_OPERATORS] as const;

export const SEARCH_FIELDS = ["name", "email"] as const;
export const SEARCH_OPERATORS = [
  "contains",
  "starts_with",
  "ends_with",
] as const;

export const SORT_BY_FIELDS = ["name", "email", "role", "createdAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
