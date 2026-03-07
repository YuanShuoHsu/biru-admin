"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import { type MenuStore, createMenuStore } from "@/stores/menu-store";

import type { Menu } from "@/types/menu";

const MenuStoreContext = createContext<StoreApi<MenuStore> | undefined>(
  undefined,
);

interface MenuStoreProviderProps {
  children: ReactNode;
  menus: Menu[];
}

export const MenuStoreProvider = ({
  children,
  menus,
}: MenuStoreProviderProps) => {
  const [store] = useState(() => createMenuStore({ isLoading: false, menus }));

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
