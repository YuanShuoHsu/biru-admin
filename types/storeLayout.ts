import {
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_VIEWS,
} from "@/constants/storeLayout";

export type StoreLayoutFloor = (typeof STORE_LAYOUT_FLOORS)[number];

export type StoreLayoutView = keyof typeof STORE_LAYOUT_VIEWS;

export type StoreLayoutMove =
  | "backward"
  | "forward"
  | "jump"
  | "left"
  | "right";
