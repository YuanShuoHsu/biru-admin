import { cache } from "react";

import { fetcher } from "./fetcher";

import type { Locale } from "@/i18n/routing";

import type { Store, StoreName, StoreSlug } from "@/types/stores";

export const getStoreName = (
  locale: Locale,
  stores: Store[],
  storeSlug?: StoreSlug,
): StoreName => {
  if (!storeSlug) return "";

  const store = stores.find(({ slug }) => slug === storeSlug);
  const localizedName = store?.name?.[locale];

  return localizedName || storeSlug;
};

export const getStores = cache(async () => {
  try {
    const data = await fetcher<Store[]>("/api/stores", {
      next: { revalidate: 60, tags: ["stores"] },
    });

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
});
