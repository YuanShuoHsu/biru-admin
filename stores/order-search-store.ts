import { createStore } from "zustand/vanilla";

type OrderSearchState = {
  orderSearchText: string;
};

type OrderSearchActions = {
  clearOrderSearchText: () => void;
  setOrderSearchText: (text: string) => void;
};

export type OrderSearchStore = OrderSearchState & OrderSearchActions;

export const defaultInitState: OrderSearchState = {
  orderSearchText: "",
};

export const createOrderSearchStore = (
  initState: OrderSearchState = defaultInitState,
) => {
  return createStore<OrderSearchStore>()((set) => ({
    ...initState,
    clearOrderSearchText: () => set({ orderSearchText: "" }),
    setOrderSearchText: (text) => set({ orderSearchText: text }),
  }));
};
