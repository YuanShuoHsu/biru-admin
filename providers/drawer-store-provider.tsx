"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  type DrawerStore,
  createDrawerStore,
  defaultInitState,
} from "@/stores/drawer-store";

const DrawerStoreContext = createContext<StoreApi<DrawerStore> | undefined>(
  undefined,
);

interface DrawerStoreProviderProps {
  children: ReactNode;
}

export const DrawerStoreProvider = ({ children }: DrawerStoreProviderProps) => {
  const [store] = useState(() => createDrawerStore(defaultInitState));

  return (
    <DrawerStoreContext.Provider value={store}>
      {children}
    </DrawerStoreContext.Provider>
  );
};

export const useDrawerStore = <T,>(selector: (store: DrawerStore) => T): T => {
  const drawerStoreContext = useContext(DrawerStoreContext);

  if (!drawerStoreContext)
    throw new Error(`useDrawerStore must be used within DrawerStoreProvider`);

  return useStore(drawerStoreContext, selector);
};
