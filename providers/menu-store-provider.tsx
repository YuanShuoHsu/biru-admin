"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import { type MenuStore, createMenuStore } from "@/stores/menu-store";

const MenuStoreContext = createContext<StoreApi<MenuStore> | undefined>(
  undefined,
);

interface MenuStoreProviderProps {
  children: ReactNode;
}

export const MenuStoreProvider = ({ children }: MenuStoreProviderProps) => {
  const [store] = useState(() => createMenuStore());

  return (
    <MenuStoreContext.Provider value={store}>
      {children}
    </MenuStoreContext.Provider>
  );
};

export const useMenuStore = <T,>(selector: (store: MenuStore) => T): T => {
  const menuStoreContext = useContext(MenuStoreContext);

  if (!menuStoreContext)
    throw new Error(`useMenuStore must be used within MenuStoreProvider`);

  return useStore(menuStoreContext, selector);
};
