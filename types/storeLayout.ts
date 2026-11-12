import {
  STORE_LAYOUT_CHARACTERS,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_FILTERS,
  STORE_LAYOUT_VIEWS,
} from "@/constants/storeLayout";

import type { components } from "@/types/api";

export type StoreLayoutCharacter = keyof typeof STORE_LAYOUT_CHARACTERS;

export type StoreLayoutFloor = (typeof STORE_LAYOUT_FLOORS)[number];

export type StoreLayoutFloorFilter =
  (typeof STORE_LAYOUT_FLOOR_FILTERS)[number];

export type StoreLayoutData = components["schemas"]["StoreLayoutDataDto"];

export type StoreLayoutItem = components["schemas"]["StoreLayoutItemDto"];

export type StoreLayoutResponse =
  components["schemas"]["StoreLayoutResponseDto"];

export type StoreLayoutSeat = components["schemas"]["StoreLayoutSeatDto"];

export type StoreLayoutTable = StoreLayoutItem & { tableNumber: number };

export type StoreLayoutView = keyof typeof STORE_LAYOUT_VIEWS;

export interface StoreLayoutTouchInput {
  jump: boolean;
  lookSideways: number;
  lookVertical: number;
  sideways: number;
  towards: number;
  zoom: number;
}

export interface StoreLayoutJump {
  air: number;
  land: number;
  rise: number;
}

export type StoreLayoutMove =
  | "backward"
  | "forward"
  | "jump"
  | "left"
  | "lookDown"
  | "lookLeft"
  | "lookRight"
  | "lookUp"
  | "right"
  | "sprint"
  | "zoomIn"
  | "zoomOut";
