import type { StoreSlug } from "./stores";

import type { Locale } from "@/i18n/routing";

interface RouteParam {
  locale: Locale;
  menuId: string;
  sectionId: string;
  slug: string;
  storeSlug: StoreSlug;
  teamId: string;
  userId: string;
}

export type RouteParams<K extends keyof RouteParam = keyof RouteParam> =
  Readonly<Pick<RouteParam, K>>;
