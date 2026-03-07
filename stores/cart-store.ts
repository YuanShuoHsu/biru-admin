import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { getItemKey } from "@/utils/menu";

export interface CartItem {
  id: string;
  amount: number;
  extraCost: number;
  image: string | null;
  price: number;
  quantity: number;
  choices: Record<string, string[]>;
}

interface CartState {
  cartItemsMap: Record<string, CartItem>;
  cartItemsList: CartItem[];
  cartTotalAmount: number;
  cartTotalQuantity: number;
  isCartEmpty: boolean;
}

interface CartActions {
  computeCartTotals: (map: Record<string, CartItem>) => {
    cartTotalAmount: number;
    cartTotalQuantity: number;
  };
  clearCartItem: () => void;
  deleteCartItem: (item: CartItem) => void;
  updateCartItem: (item: CartItem) => void;
  getChoiceAvailableQuantity: (
    choiceId: string,
    choiceStock: number | null,
    isShared: boolean,
    itemId: string,
  ) => number;
  getCartItemTotalQuantity: (itemId: string) => number;
}

export type CartStore = CartState & CartActions;

const defaultInitState: CartState = {
  cartItemsMap: {},
  cartItemsList: [],
  cartTotalAmount: 0,
  cartTotalQuantity: 0,
  isCartEmpty: true,
};

export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set, get) => ({
        ...initState,
        computeCartTotals: (map) => {
          const cartTotalAmount = Object.values(map).reduce(
            (sum, { amount }) => sum + amount,
            0,
          );

          const cartTotalQuantity = Object.values(map).reduce(
            (sum, { quantity }) => sum + quantity,
            0,
          );

          return { cartTotalAmount, cartTotalQuantity };
        },
        clearCartItem: () =>
          set({
            cartItemsMap: {},
            cartItemsList: [],
            cartTotalAmount: 0,
            cartTotalQuantity: 0,
            isCartEmpty: true,
          }),
        deleteCartItem: (item) => {
          const { id, choices } = item;

          const { computeCartTotals, cartItemsMap } = get();
          const newMap = { ...cartItemsMap };
          const itemKey = getItemKey(id, choices);
          delete newMap[itemKey];

          const { cartTotalAmount, cartTotalQuantity } =
            computeCartTotals(newMap);

          const cartItemsList = Object.values(newMap);
          const isCartEmpty = cartTotalQuantity === 0;

          set({
            cartItemsMap: newMap,
            cartItemsList,
            cartTotalAmount,
            cartTotalQuantity,
            isCartEmpty,
          });
        },
        updateCartItem: (item) => {
          const { id, amount, choices, quantity } = item;

          const { computeCartTotals, cartItemsMap } = get();
          const itemKey = getItemKey(id, choices);
          const existing = cartItemsMap[itemKey];

          const updatedItem = existing
            ? {
                ...existing,
                amount: existing.amount + amount,
                quantity: existing.quantity + quantity,
              }
            : { ...item };

          const newMap = { ...cartItemsMap, [itemKey]: updatedItem };

          const { cartTotalAmount, cartTotalQuantity } =
            computeCartTotals(newMap);

          const cartItemsList = Object.values(newMap);
          const isCartEmpty = cartTotalQuantity === 0;

          set({
            cartItemsMap: newMap,
            cartItemsList,
            cartTotalAmount,
            cartTotalQuantity,
            isCartEmpty,
          });
        },
        getChoiceAvailableQuantity: (
          choiceId,
          choiceStock,
          isShared,
          itemId,
        ) => {
          if (choiceStock == null) return Infinity;

          const used = Object.values(get().cartItemsMap).reduce(
            (sum, { id, choices, quantity }) => {
              if (!isShared && id !== itemId) return sum;

              const hasChoice = Object.values(choices).some((selected) =>
                selected.includes(choiceId),
              );

              return sum + (hasChoice ? quantity : 0);
            },
            0,
          );

          return choiceStock - used;
        },
        getCartItemTotalQuantity: (itemId) =>
          Object.values(get().cartItemsMap).reduce(
            (sum, { id, quantity }) => (id === itemId ? sum + quantity : sum),
            0,
          ),
      }),
      {
        name: "biru-cart",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
};
