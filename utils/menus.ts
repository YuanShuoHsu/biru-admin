import { cache } from "react";

import { fetcher } from "./fetcher";

import type { Menu } from "@/types/menu";

export const getMenus = cache(async (storeId: string) => {
  try {
    const data = await fetcher<Menu[]>(`/api/stores/${storeId}/menus`, {
      next: { revalidate: 60, tags: ["menus"] },
    });

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
});
