"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  createViewStore,
  defaultInitState,
  type ViewStore,
} from "@/stores/view-store";

const ViewStoreContext = createContext<StoreApi<ViewStore> | undefined>(
  undefined,
);

interface ViewStoreProviderProps {
  children: ReactNode;
}

export const ViewStoreProvider = ({ children }: ViewStoreProviderProps) => {
  const [store] = useState(() => createViewStore(defaultInitState));

  return (
    <ViewStoreContext.Provider value={store}>
      {children}
    </ViewStoreContext.Provider>
  );
};

export const useViewStore = <T,>(selector: (store: ViewStore) => T): T => {
  const viewStoreContext = useContext(ViewStoreContext);

  if (!viewStoreContext)
    throw new Error(`useViewStore must be used within ViewStoreProvider`);

  return useStore(viewStoreContext, selector);
};
