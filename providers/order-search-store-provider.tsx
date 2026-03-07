"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  createOrderSearchStore,
  defaultInitState,
  type OrderSearchStore,
} from "@/stores/order-search-store";

const OrderSearchStoreContext = createContext<
  StoreApi<OrderSearchStore> | undefined
>(undefined);

interface OrderSearchStoreProviderProps {
  children: ReactNode;
}

export const OrderSearchStoreProvider = ({
  children,
}: OrderSearchStoreProviderProps) => {
  const [store] = useState(() => createOrderSearchStore(defaultInitState));

  return (
    <OrderSearchStoreContext.Provider value={store}>
      {children}
    </OrderSearchStoreContext.Provider>
  );
};

export const useOrderSearchStore = <T,>(
  selector: (store: OrderSearchStore) => T,
): T => {
  const orderSearchStoreContext = useContext(OrderSearchStoreContext);

  if (!orderSearchStoreContext)
    throw new Error(
      `useOrderSearchStore must be used within OrderSearchStoreProvider`,
    );

  return useStore(orderSearchStoreContext, selector);
};
