"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { usePathname } from "@/i18n/navigation";

import {
  Box,
  Button,
  type ButtonProps,
  Chip,
  Fade,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";

const StyledBox = styled(Box)({
  pointerEvents: "none",
});

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  paddingInline: theme.spacing(2),
  maxWidth: theme.breakpoints.values.sm,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  pointerEvents: "auto",
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.background.paper,
}));

const OrderBottomBar = () => {
  const { isCartEmpty, cartTotalAmount, cartTotalQuantity } = useCartStore(
    (state) => state,
  );

  const locale = useLocale();

  const pathname = usePathname();

  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const checkoutHref = `${pathname}/checkout${query}`;

  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  return (
    <Fade in={!isCartEmpty}>
      <StyledBox
        position="sticky"
        left={0}
        bottom={(theme) => theme.spacing(2)}
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={(theme) => theme.zIndex.appBar - 1}
      >
        <StyledButton
          disabled={isCartEmpty}
          fullWidth
          href={checkoutHref}
          size="large"
          variant="contained"
        >
          <Stack flexDirection="row" alignItems="center" gap={1}>
            <Typography component="span" fontWeight="bold" variant="subtitle1">
              {tCart("totalQuantity", {
                quantity: cartTotalQuantity,
              })}
            </Typography>
            <Typography component="span" variant="body2">
              /
            </Typography>
            <Typography component="span" fontWeight="bold" variant="subtitle1">
              {tCommon("currency")} {cartTotalAmount.toLocaleString(locale)}
            </Typography>
          </Stack>
          <StyledChip label={tCart("checkout")} variant="outlined" />
        </StyledButton>
      </StyledBox>
    </Fade>
  );
};

export default OrderBottomBar;
