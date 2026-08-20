import type { ChipProps } from "@mui/material/Chip";

import type { ApiOrderMode, OrderMode } from "@/types/orderMode";

export const ORDER_MODE = {
  Counter: "counter",
  DineIn: "dine-in",
  DriveThru: "drive-thru",
  Pickup: "pickup",
} as const;

export const API_ORDER_MODE: Record<OrderMode, ApiOrderMode> = {
  [ORDER_MODE.Counter]: "counter",
  [ORDER_MODE.DineIn]: "dineIn",
  [ORDER_MODE.DriveThru]: "driveThru",
  [ORDER_MODE.Pickup]: "pickup",
};

export const MODE_COLORS: Record<ApiOrderMode, ChipProps["color"]> = {
  counter: "default",
  dineIn: "info",
  driveThru: "primary",
  pickup: "error",
};
