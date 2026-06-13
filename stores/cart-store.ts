import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { Organization } from "@/types/organizations";

import { getItemKey } from "@/utils/menus";

export interface CartAddOn {
  id: string;
  modifiers: Record<string, string[]>;
}

export interface CartItem {
  menuItemId: string;
  quantity: number;
  modifiers: Record<string, string[]>;
  addOns: CartAddOn[];
}

type CartItemsMap = Record<string, CartItem>;

interface CartState {
  carts: Record<Organization["slug"], CartItemsMap>;
  activeOrganizationSlug: Organization["slug"] | null;
  cartItemsMap: CartItemsMap;
  cartItemsList: CartItem[];
  cartTotalQuantity: number;
  isCartEmpty: boolean;
}

interface CartActions {
  setActiveOrganization: (slug: Organization["slug"] | null) => void;
  clearCart: () => void;
  deleteCartItem: (item: CartItem) => void;
  updateCartItem: (item: CartItem) => void;
  getChoiceAvailableQuantity: (choiceId: string, choiceStock: number) => number;
  getCartItemTotalQuantity: (menuItemId: string) => number;
}

export type CartStore = CartState & CartActions;

const deriveCartState = (cartItemsMap: CartItemsMap) => {
  const cartItemsList = Object.values(cartItemsMap);

  const cartTotalQuantity = cartItemsList.reduce(
    (sum, { quantity }) => sum + quantity,
    0,
  );

  return {
    cartItemsMap,
    cartItemsList,
    cartTotalQuantity,
    isCartEmpty: cartTotalQuantity === 0,
  };
};

const defaultInitState: CartState = {
  carts: {},
  activeOrganizationSlug: null,
  ...deriveCartState({}),
};

export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set, get) => {
        const setActiveCart = (cartItemsMap: CartItemsMap) => {
          const { activeOrganizationSlug, carts } = get();
          if (!activeOrganizationSlug) return;

          set({
            carts: { ...carts, [activeOrganizationSlug]: cartItemsMap },
            ...deriveCartState(cartItemsMap),
          });
        };

        return {
          ...initState,
          setActiveOrganization: (slug) =>
            set(({ carts }) => ({
              activeOrganizationSlug: slug,
              ...deriveCartState(slug ? (carts[slug] ?? {}) : {}),
            })),
          clearCart: () => setActiveCart({}),
          deleteCartItem: (item) => {
            const { menuItemId, modifiers, addOns } = item;

            const newMap = { ...get().cartItemsMap };
            delete newMap[getItemKey(menuItemId, modifiers, addOns)];

            setActiveCart(newMap);
          },
          updateCartItem: (item) => {
            const { menuItemId, modifiers, addOns, quantity } = item;

            const { cartItemsMap } = get();
            const itemKey = getItemKey(menuItemId, modifiers, addOns);
            const existing = cartItemsMap[itemKey];

            const updatedItem = existing
              ? {
                  ...existing,
                  quantity: existing.quantity + quantity,
                }
              : { ...item };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [itemKey]: _, ...rest } = cartItemsMap;
            setActiveCart({ [itemKey]: updatedItem, ...rest });
          },
          getChoiceAvailableQuantity: (choiceId, choiceStock) => {
            const used = get().cartItemsList.reduce(
              (sum, { addOns, quantity }) =>
                sum + (addOns.some(({ id }) => id === choiceId) ? quantity : 0),
              0,
            );

            return choiceStock - used;
          },
          getCartItemTotalQuantity: (menuItemId) =>
            get().cartItemsList.reduce(
              (sum, item) =>
                item.menuItemId === menuItemId ? sum + item.quantity : sum,
              0,
            ),
        };
      },
      {
        name: "biru-cart",
        storage: createJSONStorage(() => localStorage),
        partialize: ({ carts }) => ({ carts }),
        version: 4,
        migrate: () => ({ carts: {} }),
      },
    ),
  );
};
