import { useTranslations } from "next-intl";
import { Fragment } from "react";

import CartItemRow from "./CartItemRow";

import { Divider, List, NoSsr, Typography } from "@mui/material";

import { useCartStore } from "@/providers/cart-store-provider";

import { getItemKey } from "@/utils/menu";

interface CartItemListProps {
  forceXsLayout?: boolean;
}

const CartItemList = ({ forceXsLayout = false }: CartItemListProps) => {
  const { isCartEmpty, cartItemsList } = useCartStore((state) => state);

  const tCommon = useTranslations("common");

  const loading = <Typography padding={2}>{tCommon("loading")}</Typography>;

  return (
    <List disablePadding>
      <NoSsr defer fallback={loading}>
        {isCartEmpty ? (
          <Typography padding={2} variant="body1">
            {tCommon("empty")}
          </Typography>
        ) : (
          cartItemsList.map((item, index) => {
            const { id, choices } = item;

            return (
              <Fragment key={getItemKey(id, choices)}>
                <CartItemRow forceXsLayout={forceXsLayout} item={item} />
                {index < cartItemsList.length - 1 && (
                  <Divider component="li" variant="inset" />
                )}
              </Fragment>
            );
          })
        )}
      </NoSsr>
    </List>
  );
};

export default CartItemList;
