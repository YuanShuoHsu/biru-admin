"use client";

import { useParams } from "next/navigation";

import { MAX_QUANTITY } from "@/constants/cart";
import { API_ORDER_MODE } from "@/constants/orderMode";

import { useOutsideAvailableHours } from "@/hooks/useOutsideAvailableHours";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import type { RouteParams } from "@/types/routeParams";

import {
  getCartAvailableHours,
  getItemStock,
  getLimitingAddOnsCap,
  hasInvalidChoices,
} from "@/utils/menus";

const useCartHasInvalidItems = (): boolean => {
  const { cartItemsList, getCartItemTotalQuantity } = useCartStore(
    (state) => state,
  );
  const { menu } = useMenuStore((state) => state);

  const { mode } = useParams<RouteParams<"mode">>();
  const apiMode = API_ORDER_MODE[mode];

  const isOutsideAvailableHours = useOutsideAvailableHours();

  if (
    getCartAvailableHours(menu, cartItemsList).some(({ availableHours }) =>
      isOutsideAvailableHours(availableHours),
    )
  )
    return true;

  return cartItemsList.some((item) => {
    const { addOns, menuItemId } = item;
    const itemStock = getItemStock(menu, menuItemId, apiMode);
    const itemStockLeft = itemStock === null ? Infinity : itemStock;
    const cartItemTotalQuantity = getCartItemTotalQuantity(menuItemId, null);

    const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
    const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;
    const { cap: addOnCapLeft } = getLimitingAddOnsCap(
      menu,
      menuItemId,
      addOns,
      (addOnId) => getCartItemTotalQuantity(addOnId, null),
    );

    return (
      hasInvalidChoices(menu, item, apiMode) ||
      Math.min(perItemCapLeft, itemStockCapLeft, addOnCapLeft) < 0
    );
  });
};

export default useCartHasInvalidItems;
