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
  addCartItem: (item: CartItem) => void;
  clearCart: () => void;
  deleteCartItem: (item: CartItem) => void;
  getCartItemTotalQuantity: (menuItemId: string) => number;
  getChoiceAvailableQuantity: (choiceId: string, choiceStock: number) => number;
  setActiveOrganization: (slug: Organization["slug"] | null) => void;
  updateCartItem: (oldItem: CartItem, newItem: CartItem) => void;
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
          addCartItem: (item) => {
            const { cartItemsMap } = get();
            const itemKey = getItemKey(
              item.menuItemId,
              item.modifiers,
              item.addOns,
            );
            const existing = cartItemsMap[itemKey];

            if (existing) {
              setActiveCart({
                ...cartItemsMap,
                [itemKey]: {
                  ...existing,
                  quantity: existing.quantity + item.quantity,
                },
              });
            } else {
              setActiveCart({ [itemKey]: item, ...cartItemsMap });
            }
          },
          clearCart: () => setActiveCart({}),
          deleteCartItem: (item) => {
            const newMap = { ...get().cartItemsMap };
            delete newMap[
              getItemKey(item.menuItemId, item.modifiers, item.addOns)
            ];
            setActiveCart(newMap);
          },
          getCartItemTotalQuantity: (menuItemId) =>
            get().cartItemsList.reduce(
              (sum, item) =>
                item.menuItemId === menuItemId ? sum + item.quantity : sum,
              0,
            ),
          getChoiceAvailableQuantity: (choiceId, choiceStock) => {
            const used = get().cartItemsList.reduce(
              (sum, { addOns, quantity }) =>
                sum + (addOns.some(({ id }) => id === choiceId) ? quantity : 0),
              0,
            );

            return choiceStock - used;
          },
          setActiveOrganization: (slug) =>
            set(({ carts }) => ({
              activeOrganizationSlug: slug,
              ...deriveCartState(slug ? (carts[slug] ?? {}) : {}),
            })),
          updateCartItem: (oldItem, newItem) => {
            const { cartItemsMap } = get();
            const oldKey = getItemKey(
              oldItem.menuItemId,
              oldItem.modifiers,
              oldItem.addOns,
            );
            const newKey = getItemKey(
              newItem.menuItemId,
              newItem.modifiers,
              newItem.addOns,
            );

            if (oldKey === newKey) {
              setActiveCart({ ...cartItemsMap, [oldKey]: newItem });
              return;
            }

            const existing = cartItemsMap[newKey];

            setActiveCart(
              Object.fromEntries(
                Object.entries(cartItemsMap).flatMap(([key, item]) => {
                  if (key === oldKey)
                    return existing ? [] : [[newKey, newItem]];
                  if (key === newKey)
                    return [
                      [
                        newKey,
                        { ...item, quantity: item.quantity + newItem.quantity },
                      ],
                    ];
                  return [[key, item]];
                }),
              ),
            );
          },
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
