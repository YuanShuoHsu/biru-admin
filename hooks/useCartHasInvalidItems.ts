"use client";

import { useParams } from "next/navigation";

import { MAX_QUANTITY } from "@/constants/cart";
import { API_ORDER_MODE } from "@/constants/orderMode";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import type { RouteParams } from "@/types/routeParams";

import {
  getItemStock,
  getLimitingAddOnsCap,
  hasUnavailableChoices,
} from "@/utils/menus";

const useCartHasInvalidItems = (): boolean => {
  const {
    cartItemsList,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
  } = useCartStore((state) => state);
  const { menu } = useMenuStore((state) => state);

  const { mode } = useParams<RouteParams<"mode">>();
  const apiMode = API_ORDER_MODE[mode];

  return cartItemsList.some((item) => {
    const { addOns, menuItemId } = item;
    const itemStock = getItemStock(menu, menuItemId, apiMode);
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

    return (
      hasUnavailableChoices(menu, item, apiMode) ||
      Math.min(perItemCapLeft, itemStockCapLeft, addOnCapLeft) < 0
    );
  });
};

export default useCartHasInvalidItems;
