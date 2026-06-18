"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import useCartTotals from "@/hooks/useCartTotals";

import { usePathname } from "@/i18n/navigation";

import {
  Box,
  Button,
  type ButtonProps,
  Chip,
  Container,
  Fade,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";

const StyledContainer = styled(Container)(({ theme }) => ({
  position: "sticky",
  bottom: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(2),
  pointerEvents: "none",
  zIndex: theme.zIndex.appBar - 1,
}));

const StyledButton = styled(Button)<ButtonProps>(({ theme, variant }) => ({
  padding: theme.spacing(2),
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
  pointerEvents: "auto",
  ...(variant === "outlined" && {
    flex: 1,
  }),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.background.paper,
}));

const OrderBottomBar = () => {
  const { cartTotalQuantity, isCartEmpty } = useCartStore((state) => state);

  const { cartCurrency, cartTotalAmount } = useCartTotals();

  const locale = useLocale();

  const pathname = usePathname();

  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const cartHref = `${pathname}/cart${query}`;
  const checkoutHref = `${pathname}/checkout${query}`;

  const tOrder = useTranslations("order");

  return (
    <Fade in={!isCartEmpty}>
      <StyledContainer disableGutters maxWidth="sm">
        <StyledButton href={cartHref} variant="outlined">
          <Typography flex={1} fontWeight="bold" variant="subtitle1">
            {tOrder("cart.totalQuantity", { quantity: cartTotalQuantity })}{" "}
            <Box component="span" typography="body2">
              /
            </Box>{" "}
            {cartCurrency} {cartTotalAmount.toLocaleString(locale)}
          </Typography>
          <Chip
            color="primary"
            label={tOrder("cart.view")}
            variant="outlined"
          />
        </StyledButton>
        <StyledButton href={checkoutHref} variant="contained">
          <StyledChip label={tOrder("cart.next")} variant="outlined" />
        </StyledButton>
      </StyledContainer>
    </Fade>
  );
};

export default OrderBottomBar;
