"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import CartItemList from "@/components/CartItemList";

import { usePathname } from "@/i18n/navigation";

import {
  Box,
  Button,
  Drawer,
  Stack,
  Theme,
  Toolbar,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDrawerStore } from "@/providers/drawer-store-provider";

import { handleDrawerToggle } from "@/utils/drawer";

const DrawerBox = styled(Box)({
  width: 250,
});

const stickyBaseStyles = (theme: Theme) => ({
  position: "sticky" as const,
  backgroundColor: theme.vars.palette.background.paper,
  zIndex: theme.zIndex.appBar,
});

const StickyHeader = styled(Box)(({ theme }) => ({
  ...stickyBaseStyles(theme),
  top: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StickyFooter = styled(Box)(({ theme }) => ({
  ...stickyBaseStyles(theme),
  bottom: 0,
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const CartAnchorTemporaryDrawer = () => {
  const { isCartEmpty, cartTotalAmount } = useCartStore((state) => state);
  const { drawer, setDrawerOpen } = useDrawerStore((state) => state);
  const open = drawer.cart;
  const handleCartClose = handleDrawerToggle(setDrawerOpen, "cart", false);

  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";

  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  const isCheckoutPage = pathname.endsWith("/checkout");
  const basePath = isCheckoutPage
    ? pathname.slice(0, -"/checkout".length)
    : pathname;
  const menuHref = `${basePath}${query}`;
  const checkoutHref = `${basePath}/checkout${query}`;

  const actionDisabled = !isCheckoutPage && isCartEmpty;
  const actionHref = isCheckoutPage ? menuHref : checkoutHref;
  const actionLabel = isCheckoutPage ? tCart("backToOrder") : tCart("checkout");

  const drawerList = (
    <DrawerBox role="presentation">
      <StickyHeader>
        <Toolbar>
          <Typography variant="h6">{tCart("title")}</Typography>
        </Toolbar>
      </StickyHeader>
      <CartItemList forceXsLayout />
      <StickyFooter>
        <Stack
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography component="span" variant="subtitle1">
            {tCommon("totalAmount")}
          </Typography>
          <Typography
            color="primary"
            component="span"
            fontWeight="bold"
            variant="h6"
          >
            {tCommon("currency")} {cartTotalAmount.toLocaleString(locale)}
          </Typography>
        </Stack>
        <Button
          disabled={actionDisabled}
          fullWidth
          href={actionHref}
          onClick={handleCartClose}
          variant="contained"
        >
          {actionLabel}
        </Button>
      </StickyFooter>
    </DrawerBox>
  );

  return (
    <Drawer
      anchor="right"
      ModalProps={{ keepMounted: true }}
      onClose={handleCartClose}
      open={open}
    >
      {drawerList}
    </Drawer>
  );
};

export default CartAnchorTemporaryDrawer;
