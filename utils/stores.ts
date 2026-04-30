import { cache } from "react";

import { fetcher } from "./fetcher";

import type { Store } from "@/types/stores";

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
