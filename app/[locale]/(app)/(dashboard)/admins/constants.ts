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
