import { createStore } from "zustand/vanilla";

import { ViewMode } from "@/types/view";

type ViewState = {
  view: ViewMode;
};

type ViewActions = {
  setView: (view: ViewMode) => void;
};

export type ViewStore = ViewState & ViewActions;

export const defaultInitState: ViewState = {
  view: "module",
};

export const createViewStore = (initState: ViewState = defaultInitState) => {
  return createStore<ViewStore>()((set) => ({
    ...initState,
    setView: (view) => set({ view }),
  }));
};
