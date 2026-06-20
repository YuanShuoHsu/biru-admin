"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import { type MenuStore, createMenuStore } from "@/stores/menu-store";

import type { OrderMenu } from "@/types/menus";

const MenuStoreContext = createContext<StoreApi<MenuStore> | undefined>(
  undefined,
);

interface MenuStoreProviderProps {
  children: ReactNode;
  initialMenu: OrderMenu | null;
}

export const MenuStoreProvider = ({
  children,
  initialMenu,
}: MenuStoreProviderProps) => {
  const [store] = useState(() =>
    createMenuStore({ isLoading: false, menu: initialMenu }),
  );

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
