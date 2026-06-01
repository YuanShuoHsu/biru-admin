import { createStore } from "zustand/vanilla";

import type { OrderMenu } from "@/types/menus";

type MenuState = {
  isLoading: boolean;
  menus: OrderMenu[];
};

type MenuActions = {
  setMenu: (options: Partial<MenuState>) => void;
};

export type MenuStore = MenuState & MenuActions;

export const defaultInitState: MenuState = {
  isLoading: true,
  menus: [],
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
