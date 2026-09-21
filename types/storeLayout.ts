import {
  STORE_LAYOUT_CHARACTERS,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_FILTERS,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_VIEWS,
} from "@/constants/storeLayout";

export type StoreLayoutCharacter = keyof typeof STORE_LAYOUT_CHARACTERS;

export type StoreLayoutFloor = (typeof STORE_LAYOUT_FLOORS)[number];

export type StoreLayoutFloorFilter =
  (typeof STORE_LAYOUT_FLOOR_FILTERS)[number];

export type StoreLayoutItem = (typeof STORE_LAYOUT_ITEMS)[number];

export type StoreLayoutView = keyof typeof STORE_LAYOUT_VIEWS;

export interface StoreLayoutTouchInput {
  jump: boolean;
  lookSideways: number;
  lookVertical: number;
  sideways: number;
  towards: number;
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
  | "sprint";
