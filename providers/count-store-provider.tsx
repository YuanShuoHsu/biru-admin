"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  type CountStore,
  createCountStore,
  defaultCountState,
} from "@/stores/count-store";

const CountStoreContext = createContext<StoreApi<CountStore> | undefined>(
  undefined,
);

interface CountStoreProviderProps {
  children: ReactNode;
  initialItems?: Record<string, number>;
}

export const CountStoreProvider = ({
  children,
  initialItems = {},
}: CountStoreProviderProps) => {
  const [store] = useState(() =>
    createCountStore({ ...defaultCountState, items: initialItems }),
  );

  return (
    <CountStoreContext.Provider value={store}>
      {children}
    </CountStoreContext.Provider>
  );
};

export const useCountStore = <T,>(selector: (store: CountStore) => T): T => {
  const countStoreContext = useContext(CountStoreContext);

  if (!countStoreContext)
    throw new Error(`useCountStore must be used within CountStoreProvider`);

  return useStore(countStoreContext, selector);
};
