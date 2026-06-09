import type { ItemAvailability } from "@/types/menus";

export const ITEM_AVAILABILITY_COLOR_MAP: Record<
  ItemAvailability,
  "success" | "warning" | "default"
> = {
  InStock: "success",
  SoldOut: "warning",
  Discontinued: "default",
};
