import type { Locale } from "@/i18n/routing";

interface RouteParam {
  addOnId: string;
  couponId: string;
  groupId: string;
  ingredientId: string;
  linkId: string;
  locale: Locale;
  menuItemId: string;
  menuSectionId: string;
  modifierId: string;
  orderId: string;
  recipeId: string;
  slug: string;
  supplierId: string;
  teamId: string;
  userId: string;
}

export type RouteParams<K extends keyof RouteParam = keyof RouteParam> =
  Readonly<Pick<RouteParam, K>>;
