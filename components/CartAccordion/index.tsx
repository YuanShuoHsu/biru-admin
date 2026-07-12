"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import CartItemList from "@/components/CartItemList";
import CustomizedAccordions from "@/components/CustomizedAccordions";

import { type AccordionProps, Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import useCartTotals from "@/hooks/useCartTotals";

import type { ValidateCouponResponse } from "@/types/coupons";

const OriginalPriceTypography = styled(Typography)({
  textDecoration: "line-through",
});

interface CartAccordionProps extends Omit<AccordionProps, "children"> {
  coupon: ValidateCouponResponse | null;
}

const CartAccordion = ({ coupon, ...props }: CartAccordionProps) => {
  const { cartCurrency, cartTotalAmount } = useCartTotals();

  const { locale } = useParams();

  const tCommon = useTranslations("common");

  return (
    <CustomizedAccordions
      elevation={0}
      summary={
        <>
          <Typography component="span" flex={1} variant="subtitle1">
            {tCommon(coupon ? "total" : "subtotal")}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            {coupon && (
              <OriginalPriceTypography
                color="text.disabled"
                fontWeight="bold"
                variant="caption"
              >
                {cartCurrency} {cartTotalAmount.toLocaleString(locale)}
              </OriginalPriceTypography>
            )}
            <Typography
              color="primary"
              component="span"
              fontWeight="bold"
              variant="h6"
            >
              {cartCurrency}{" "}
              {(coupon ? Number(coupon.total) : cartTotalAmount).toLocaleString(
                locale,
              )}
            </Typography>
          </Stack>
          <Box flex={1} />
        </>
      }
      {...props}
    >
      <CartItemList compact />
    </CustomizedAccordions>
  );
};

export default CartAccordion;
