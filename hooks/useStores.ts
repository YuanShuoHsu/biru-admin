"use client";

import useSWR from "swr";

import { swrKeys } from "@/constants/swr";

import type { Store } from "@/types/stores";

export const useStores = () => {
  const { data: stores = [] } = useSWR<Store[]>(swrKeys.stores);

  return stores;
};
