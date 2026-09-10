// https://zustand.docs.pmnd.rs/guides/nextjs

import { createStore } from "zustand/vanilla";

export type CountState = {
  items: Record<string, number>;
};

export type CountActions = {
  getCount: (key: string) => number;
  setCount: (key: string, count: number) => void;
};

export type CountStore = CountState & CountActions;

export const defaultCountState: CountState = {
  items: {},
};

export const createCountStore = (initState: CountState = defaultCountState) => {
  return createStore<CountStore>()((set, get) => ({
    ...initState,
    getCount: (key) => get().items[key],
    setCount: (key, count) =>
      set((state) => ({ items: { ...state.items, [key]: count } })),
  }));
};
