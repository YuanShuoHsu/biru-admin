"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import CartItemList from "@/components/CartItemList";
import CustomizedAccordions from "@/components/CustomizedAccordions";

import { Box, Typography } from "@mui/material";

import useCartTotals from "@/hooks/useCartTotals";

interface CartAccordionProps {
  defaultExpanded?: boolean;
}

const CartAccordion = ({ defaultExpanded = true }: CartAccordionProps) => {
  const { cartCurrency, cartTotalAmount } = useCartTotals();

  const { locale } = useParams();

  const tCommon = useTranslations("common");

  return (
    <CustomizedAccordions
      defaultExpanded={defaultExpanded}
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
    >
      <CartItemList compact />
    </CustomizedAccordions>
  );
};

export default CartAccordion;
