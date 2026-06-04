import type { OrderMode } from "./orderMode";
import type { Organization } from "./organizations";

import type { Locale } from "@/i18n/routing";

interface RouteParam {
  groupId: string;
  locale: Locale;
  menuId: string;
  menuItemId: string;
  menuSectionId: string;
  mode: OrderMode;
  organizationSlug: Organization["slug"];
  slug: string;
  teamId: string;
  userId: string;
}

export type RouteParams<K extends keyof RouteParam = keyof RouteParam> =
  Readonly<Pick<RouteParam, K>>;
