import { cache } from "react";

import { type FetchError, fetcher } from "./fetcher";

import type { StoreLayoutData, StoreLayoutResponse } from "@/types/storeLayout";

export const getStoreLayout = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<StoreLayoutData | null> => {
    try {
      const { data } = await fetcher<StoreLayoutResponse>(
        `/api/organizations/${organizationSlug}/store-layout`,
        init,
      );

      return data;
    } catch (error) {
      if ((error as FetchError).status === 404) return null;
      throw error;
    }
  },
);
