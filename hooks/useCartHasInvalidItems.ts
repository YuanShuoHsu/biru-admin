"use client";

import { MAX_QUANTITY } from "@/constants/cart";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import { getItemStock, getLimitingAddOnsCap } from "@/utils/menus";

const useCartHasInvalidItems = (): boolean => {
  const {
    cartItemsList,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
  } = useCartStore((state) => state);
  const { menu } = useMenuStore((state) => state);

  return cartItemsList.some(({ menuItemId, addOns }) => {
    const itemStock = getItemStock(menu, menuItemId);
    const itemStockLeft = itemStock === null ? Infinity : itemStock;
    const cartItemTotalQuantity = getCartItemTotalQuantity(menuItemId);

    const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
    const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;
    const { cap: addOnCapLeft } = getLimitingAddOnsCap(
      menu,
      menuItemId,
      addOns,
      getChoiceAvailableQuantity,
    );

    return Math.min(perItemCapLeft, itemStockCapLeft, addOnCapLeft) < 0;
  });
};

export default useCartHasInvalidItems;
