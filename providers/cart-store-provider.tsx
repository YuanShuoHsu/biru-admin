"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import { type CartStore, createCartStore } from "@/stores/cart-store";

const CartStoreContext = createContext<StoreApi<CartStore> | undefined>(
  undefined,
);

interface CartStoreProviderProps {
  children: ReactNode;
}

export const CartStoreProvider = ({ children }: CartStoreProviderProps) => {
  const [store] = useState(() => createCartStore());

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
};

export const useCartStore = <T,>(selector: (store: CartStore) => T): T => {
  const cartStoreContext = useContext(CartStoreContext);

  if (!cartStoreContext)
    throw new Error(`useCartStore must be used within CartStoreProvider`);

  return useStore(cartStoreContext, selector);
};
