export const STRING_FILTER_FIELDS = [
  "addOnMenuSectionName",
  "addOnMenuItemName",
] as const;
export const DATE_FILTER_FIELDS = ["createdAt", "updatedAt"] as const;
export const FILTER_FIELDS = [
  ...STRING_FILTER_FIELDS,
  ...DATE_FILTER_FIELDS,
] as const;

export const SORT_BY_FIELDS = [
  "addOnMenuSectionName",
  "addOnMenuItemName",
  "createdAt",
  "updatedAt",
] as const;
