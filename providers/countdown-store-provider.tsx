"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  type CountdownStore,
  createCountdownStore,
  defaultInitState,
} from "@/stores/countdown-store";

export const CountdownStoreContext = createContext<
  StoreApi<CountdownStore> | undefined
>(undefined);

interface CountdownStoreProviderProps {
  children: ReactNode;
}

export const CountdownStoreProvider = ({
  children,
}: CountdownStoreProviderProps) => {
  const [store] = useState(() => createCountdownStore(defaultInitState));

  return (
    <CountdownStoreContext.Provider value={store}>
      {children}
    </CountdownStoreContext.Provider>
  );
};

export const useCountdownStore = <T,>(
  selector: (store: CountdownStore) => T,
): T => {
  const countdownStoreContext = useContext(CountdownStoreContext);

  if (!countdownStoreContext)
    throw new Error(
      `useCountdownStore must be used within CountdownStoreProvider`,
    );

  return useStore(countdownStoreContext, selector);
};
