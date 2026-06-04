export const FILTER_FIELDS = [
  "email",
  "name",
  "role",
  "banned",
  "emailSubscribed",
  "createdAt",
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
  "isAnyOf",
] as const;
export const ENUM_FILTER_OPERATORS = ["is", "not", "isAnyOf"] as const;
export const DATE_FILTER_OPERATORS = [
  "is",
  "not",
  "after",
  "onOrAfter",
  "before",
  "onOrBefore",
  "isEmpty",
  "isNotEmpty",
] as const;
export const FILTER_OPERATORS = [
  "contains",
  "doesNotContain",
  "equals",
  "doesNotEqual",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
  "is",
  "not",
  "isAnyOf",
  "after",
  "onOrAfter",
  "before",
  "onOrBefore",
] as const;
export const SEARCH_FIELDS = ["name", "email"] as const;
export const SEARCH_OPERATORS = ["contains", "startsWith", "endsWith"] as const;

export const SORT_BY = [
  "name",
  "email",
  "role",
  "banned",
  "emailSubscribed",
  "createdAt",
] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
