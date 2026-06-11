import { createStore } from "zustand/vanilla";

import type { OrderMenu } from "@/types/menus";

type MenuState = {
  isLoading: boolean;
  menu: OrderMenu | null;
};

type MenuActions = {
  setMenu: (options: Partial<MenuState>) => void;
};

export type MenuStore = MenuState & MenuActions;

export const defaultInitState: MenuState = {
  isLoading: true,
  menu: null,
};

export const createMenuStore = (initState: MenuState = defaultInitState) => {
  return createStore<MenuStore>()((set) => ({
    ...initState,
    setMenu: (options) =>
      set((state) => ({
        ...state,
        ...options,
      })),
  }));
};
