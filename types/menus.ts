import type { components } from "@/types/api";

export type Menu = components["schemas"]["MenuResponseDto"];
export type MenuSection = components["schemas"]["MenuSectionResponseDto"];
export type MenuItem = components["schemas"]["MenuItemResponseDto"];
export type MenuItemAddOn = components["schemas"]["MenuItemAddOnResponseDto"];

export type OrderMenu = components["schemas"]["OrderMenuResponseDto"];
export type OrderMenuItem = components["schemas"]["OrderMenuItemResponseDto"];

export type ModifierGroup = components["schemas"]["ModifierGroupResponseDto"];
export type Modifier = components["schemas"]["ModifierResponseDto"];
export type MenuItemModifierGroup =
  components["schemas"]["MenuItemModifierGroupResponseDto"];
