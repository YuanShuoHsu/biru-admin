import type { ServingTemperature } from "@/types/menus";

export const LOW_STOCK_THRESHOLD = 5;

export const SERVING_TEMPERATURE_COLOR_MAP: Record<
  ServingTemperature,
  "error" | "info"
> = {
  Hot: "error",
  Iced: "info",
};
