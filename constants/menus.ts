import type {
  ServingTemperature,
  ServingTemperatureLevel,
  Sweetness,
} from "@/types/menus";

export const LOW_STOCK_THRESHOLD = 5;

export const SERVING_TEMPERATURE_COLOR_MAP: Record<
  ServingTemperature,
  "error" | "info"
> = {
  Hot: "error",
  Iced: "info",
};

export const SWEETNESS_COLOR_MAP: Record<
  Exclude<Sweetness, "NotApplicable">,
  "primary" | "default"
> = {
  Fixed: "default",
  Adjustable: "primary",
};

export const SERVING_TEMPERATURE_OF_LEVEL: Record<
  ServingTemperatureLevel,
  ServingTemperature
> = {
  RegularIce: "Iced",
  LessIce: "Iced",
  LightIce: "Iced",
  NoIce: "Iced",
  Warm: "Hot",
  Hot: "Hot",
};
