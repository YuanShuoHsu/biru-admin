import { createStore } from "zustand/vanilla";

import { DrawerType } from "@/types/drawer";

type DrawerState = {
  drawer: Record<DrawerType, boolean>;
};

type DrawerActions = {
  setDrawerOpen: (type: DrawerType, open: boolean) => void;
};

export type DrawerStore = DrawerState & DrawerActions;

export const defaultInitState: DrawerState = {
  drawer: {
    cart: false,
    nav: false,
  },
};

export const createDrawerStore = (
  initState: DrawerState = defaultInitState,
) => {
  return createStore<DrawerStore>()((set) => ({
    ...initState,
    setDrawerOpen: (type, open) =>
      set((state) => ({
        drawer: {
          ...state.drawer,
          [type]: open,
        },
      })),
  }));
};
