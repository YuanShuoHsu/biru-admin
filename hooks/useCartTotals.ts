"use client";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import { calcCartItemAmount, getCartCurrency } from "@/utils/menus";

const useCartTotals = () => {
  const { cartItemsList } = useCartStore((state) => state);
  const { menu } = useMenuStore((state) => state);

  const cartTotalAmount = cartItemsList.reduce(
    (sum, item) => sum + calcCartItemAmount(menu, item),
    0,
  );
  const cartCurrency = getCartCurrency(menu, cartItemsList);

  return { cartCurrency, cartTotalAmount };
};

export default useCartTotals;
