export const STRING_FILTER_FIELDS = ["displayName"] as const;
export const DATE_FILTER_FIELDS = ["createdAt", "updatedAt"] as const;
export const FILTER_FIELDS = [
  ...STRING_FILTER_FIELDS,
  ...DATE_FILTER_FIELDS,
] as const;

export const STRING_FILTER_OPERATORS = [
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
  "isAnyOf",
  "is",
  "not",
  "after",
  "onOrAfter",
  "before",
  "onOrBefore",
] as const;

export const SORT_BY_FIELDS = [
  "displayName",
  "createdAt",
  "updatedAt",
] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;

// 對應 biru-api itemAvailabilityEnum；i18n 標籤共用 menus.offers.availability.options
export const ITEM_AVAILABILITY_OPTIONS = [
  "BackOrder",
  "Discontinued",
  "InStock",
  "InStoreOnly",
  "LimitedAvailability",
  "MadeToOrder",
  "OnlineOnly",
  "OutOfStock",
  "PreOrder",
  "PreSale",
  "Reserved",
  "SoldOut",
] as const;
