"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import CartItemList from "@/components/CartItemList";
import CustomizedAccordions from "@/components/CustomizedAccordions";

import { type AccordionProps, Box, Typography } from "@mui/material";

import useCartTotals from "@/hooks/useCartTotals";

type CartAccordionProps = Omit<AccordionProps, "children">;

const CartAccordion = (props: CartAccordionProps) => {
  const { cartCurrency, cartTotalAmount } = useCartTotals();

  const { locale } = useParams();

  const tCommon = useTranslations("common");

  return (
    <CustomizedAccordions
      elevation={0}
      summary={
        <>
          <Typography component="span" flex={1} variant="subtitle1">
            {tCommon("totalAmount")}
          </Typography>
          <Typography
            color="primary"
            component="span"
            flex="auto"
            fontWeight="bold"
            textAlign="center"
            variant="h6"
          >
            {cartCurrency} {cartTotalAmount.toLocaleString(locale)}
          </Typography>
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
