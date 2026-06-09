export const STRING_FILTER_FIELDS = ["name", "description"] as const;
export const DATE_FILTER_FIELDS = ["createdAt", "updatedAt"] as const;
export const FILTER_FIELDS = [
  ...STRING_FILTER_FIELDS,
  ...DATE_FILTER_FIELDS,
] as const;

export const SEARCH_FIELDS = ["name", "description"] as const;
export const SEARCH_OPERATORS = ["contains", "startsWith", "endsWith"] as const;

export const SORT_BY_FIELDS = [
  "name",
  "description",
  "createdAt",
  "updatedAt",
] as const;
