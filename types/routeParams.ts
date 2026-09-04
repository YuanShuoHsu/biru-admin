import type { OrderMode } from "./orderMode";
import type { Organization } from "./organizations";

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
  mode: OrderMode;
  modifierId: string;
  orderId: string;
  recipeId: string;
  organizationSlug: Organization["slug"];
  slug: string;
  supplierId: string;
  teamId: string;
  userId: string;
}

export type RouteParams<K extends keyof RouteParam = keyof RouteParam> =
  Readonly<Pick<RouteParam, K>>;
