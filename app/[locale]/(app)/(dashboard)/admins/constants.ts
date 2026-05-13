export const FILTER_FIELDS = [
  "email",
  "name",
  "role",
  "banned",
  "emailSubscribed",
] as const;
export const TEXT_FILTER_OPERATORS = [
  "contains",
  "doesNotContain",
  "equals",
  "doesNotEqual",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
] as const;
export const ENUM_FILTER_OPERATORS = ["is", "not", "isAnyOf"] as const;
export const FILTER_OPERATORS = [
  ...TEXT_FILTER_OPERATORS,
  ...ENUM_FILTER_OPERATORS,
] as const;
export const NO_VALUE_FILTER_OPERATORS: readonly string[] = [
  "isEmpty",
  "isNotEmpty",
];

export const SEARCH_FIELDS = ["name", "email"] as const;
export const SEARCH_OPERATORS = ["contains", "startsWith", "endsWith"] as const;

export const SORT_BY = ["name", "email", "role", "createdAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
