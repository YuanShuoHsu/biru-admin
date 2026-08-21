import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { OrderMode } from "@/types/orderMode";
import type { Organization } from "@/types/organizations";

import { getItemKey } from "@/utils/menus";

export interface CartAddOn {
  menuItemId: string;
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
  carts: Record<string, CartItemsMap>;
  cartKey: string | null;
  cartItemsMap: CartItemsMap;
  cartItemsList: CartItem[];
  cartTotalQuantity: number;
  isCartEmpty: boolean;
  checkoutKey: string | null;
  checkoutKeys: Record<string, string>;
  lastOrderId: string | null;
}

interface CartActions {
  addCartItem: (item: CartItem) => void;
  clearCart: () => void;
  deleteCartItem: (item: CartItem) => void;
  getCartItemTotalQuantity: (
    menuItemId: string,
    excludedItem: CartItem | null,
  ) => number;
  setCartKey: (
    mode: OrderMode | null,
    slug: Organization["slug"] | null,
  ) => void;
  setLastOrderId: (orderId: string | null) => void;
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
  cartKey: null,
  ...deriveCartState({}),
  checkoutKey: null,
  checkoutKeys: {},
  lastOrderId: null,
};

export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set, get) => {
        const setActiveCart = (cartItemsMap: CartItemsMap) => {
          const { cartKey, carts, checkoutKeys } = get();
          if (!cartKey) return;

          const checkoutKey = crypto.randomUUID();

          set({
            carts: { ...carts, [cartKey]: cartItemsMap },
            checkoutKey,
            checkoutKeys: { ...checkoutKeys, [cartKey]: checkoutKey },
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
          getCartItemTotalQuantity: (menuItemId, excludedItem) => {
            const excludedKey =
              excludedItem &&
              getItemKey(
                excludedItem.menuItemId,
                excludedItem.modifiers,
                excludedItem.addOns,
              );

            return Object.entries(get().cartItemsMap).reduce(
              (sum, [key, { addOns, menuItemId: id, quantity }]) => {
                if (key === excludedKey) return sum;

                const usage =
                  (id === menuItemId ? 1 : 0) +
                  (addOns.some((addOn) => addOn.menuItemId === menuItemId)
                    ? 1
                    : 0);

                return sum + usage * quantity;
              },
              0,
            );
          },
          setCartKey: (mode, slug) => {
            const key = slug && mode && `${slug}:${mode}`;

            set(({ carts, checkoutKeys }) => ({
              cartKey: key,
              checkoutKey: (key && checkoutKeys[key]) || null,
              ...deriveCartState((key && carts[key]) || {}),
            }));
          },
          setLastOrderId: (orderId) => set({ lastOrderId: orderId }),
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
        partialize: ({ carts, checkoutKeys, lastOrderId }) => ({
          carts,
          checkoutKeys,
          lastOrderId,
        }),
        version: 7,
        migrate: () => ({ carts: {} }),
      },
    ),
  );
};
