"use client";

import { useTranslations } from "next-intl";

import CustomizedBadges from "@/components/CustomizedBadges";

import { ShoppingCart } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { useCartStore } from "@/providers/cart-store-provider";

import { useToggleDrawer } from "@/utils/drawer";

const CartIconButton = () => {
  const { cartTotalQuantity } = useCartStore((state) => state);

  const toggleDrawer = useToggleDrawer();

  const tAppBar = useTranslations("appBar");

  return (
    <Tooltip title={tAppBar("cart")}>
      <IconButton
        aria-label="cart"
        color="inherit"
        onClick={toggleDrawer("cart", true)}
      >
        <CustomizedBadges badgeContent={cartTotalQuantity}>
          <ShoppingCart />
        </CustomizedBadges>
      </IconButton>
    </Tooltip>
  );
};

export default CartIconButton;
