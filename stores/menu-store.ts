import { createStore } from "zustand/vanilla";

import type { components } from "@/types/api";

type MenuState = {
  isLoading: boolean;
  menus: components["schemas"]["OrderMenuResponseDto"][];
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
