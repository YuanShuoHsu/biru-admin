import {
  type components,
  addOnFilterFieldValues,
  addOnSortFieldValues,
  menuItemFilterFieldValues,
  menuItemSortFieldValues,
  menuSectionFilterFieldValues,
  menuSectionSortFieldValues,
  modifierFilterFieldValues,
  modifierGroupFilterFieldValues,
  modifierGroupSortFieldValues,
  modifierSortFieldValues,
} from "@/types/api";

export type Menu = components["schemas"]["MenuResponseDto"];
export type MenuSection = components["schemas"]["MenuSectionResponseDto"];
export type MenuItem = components["schemas"]["MenuItemResponseDto"];
export type MenuItemAddOn = components["schemas"]["MenuItemAddOnResponseDto"];

export type OrderMenu = components["schemas"]["OrderMenuResponseDto"];
export type OrderMenuSection =
  components["schemas"]["OrderMenuSectionResponseDto"];
export type OrderMenuItem = components["schemas"]["OrderMenuItemResponseDto"];
export type OrderMenuOffer = components["schemas"]["OrderMenuOfferResponseDto"];
export type OrderMenuAddOn = components["schemas"]["OrderMenuAddOnResponseDto"];
export type OrderMenuAddOnItem =
  components["schemas"]["OrderMenuAddOnItemResponseDto"];
export type OrderMenuModifierGroup =
  components["schemas"]["OrderMenuModifierGroupResponseDto"];
export type OrderMenuModifier =
  components["schemas"]["OrderMenuModifierResponseDto"];

export type ModifierGroup = components["schemas"]["ModifierGroupResponseDto"];
export type Modifier = components["schemas"]["ModifierResponseDto"];
export type MenuItemModifierGroup =
  components["schemas"]["MenuItemModifierGroupResponseDto"];

export type ItemAvailability = components["schemas"]["ItemAvailability"];

export type MenuSectionFilterField =
  (typeof menuSectionFilterFieldValues)[number];
export type MenuSectionSortField = (typeof menuSectionSortFieldValues)[number];

export type MenuItemFilterField = (typeof menuItemFilterFieldValues)[number];
export type MenuItemSortField = (typeof menuItemSortFieldValues)[number];

export type AddOnFilterField = (typeof addOnFilterFieldValues)[number];
export type AddOnSortField = (typeof addOnSortFieldValues)[number];

export type ModifierGroupFilterField =
  (typeof modifierGroupFilterFieldValues)[number];
export type ModifierGroupSortField =
  (typeof modifierGroupSortFieldValues)[number];

export type ModifierFilterField = (typeof modifierFilterFieldValues)[number];
export type ModifierSortField = (typeof modifierSortFieldValues)[number];
