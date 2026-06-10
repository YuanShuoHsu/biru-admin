import {
  type components,
  addOnFilterFieldValues,
  addOnSortFieldValues,
  menuFilterFieldValues,
  menuSortFieldValues,
  modifierFilterFieldValues,
  modifierSortFieldValues,
} from "@/types/api";

export type Menu = components["schemas"]["MenuResponseDto"];
export type MenuSection = components["schemas"]["MenuSectionResponseDto"];
export type MenuItem = components["schemas"]["MenuItemResponseDto"];
export type MenuItemAddOn = components["schemas"]["MenuItemAddOnResponseDto"];

export type OrderMenu = components["schemas"]["OrderMenuResponseDto"];
export type OrderMenuItem = components["schemas"]["OrderMenuItemResponseDto"];
export type OrderMenuOffer = components["schemas"]["OrderMenuOfferResponseDto"];

export type ModifierGroup = components["schemas"]["ModifierGroupResponseDto"];
export type Modifier = components["schemas"]["ModifierResponseDto"];
export type MenuItemModifierGroup =
  components["schemas"]["MenuItemModifierGroupResponseDto"];

export type ItemAvailability = components["schemas"]["ItemAvailability"];

export type MenuFilterField = (typeof menuFilterFieldValues)[number];
export type MenuSortField = (typeof menuSortFieldValues)[number];

export type AddOnFilterField = (typeof addOnFilterFieldValues)[number];
export type AddOnSortField = (typeof addOnSortFieldValues)[number];

export type ModifierFilterField = (typeof modifierFilterFieldValues)[number];
export type ModifierSortField = (typeof modifierSortFieldValues)[number];
