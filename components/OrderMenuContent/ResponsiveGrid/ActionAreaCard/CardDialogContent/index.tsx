import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { MAX_QUANTITY } from "@/constants/cart";

import { AccessTime, RestaurantMenu } from "@mui/icons-material";
import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrderMenuItem } from "@/types/menus";

import { getActivePromo } from "@/utils/menus";

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  aspectRatio: "16/9",
  overflow: "hidden",
}));

const StyledRestaurantMenu = styled(RestaurantMenu)(({ theme }) => ({
  fontSize: theme.spacing(6),
}));

const WrapTypography = styled(Typography)({
  overflowWrap: "anywhere",
});

const OriginalPriceTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isPromo",
})<{ isPromo: boolean }>(({ isPromo }) => ({
  ...(isPromo && {
    textDecoration: "line-through",
    lineHeight: 1.2,
  }),
}));

interface CardDialogContentProps {
  menuItem: OrderMenuItem;
}

const CardDialogContent = ({ menuItem }: CardDialogContentProps) => {
  const { id, name, description, image, offers, suitableForDiet, nutrition } =
    menuItem;
  const offer = offers[0];
  const basePrice = parseFloat(offer?.price ?? "0") || 0;
  const priceCurrency = offer?.priceCurrency;
  const stock = offer?.inventoryLevel?.value ?? null;
  const stockUnit = offer?.inventoryLevel?.unitText;
  const availability = offer?.availability;
  const leadTime = offer?.deliveryLeadTime?.value;

  const promoInfo = getActivePromo(offer);
  const price = promoInfo?.price ?? basePrice;

  const [rawQuantity, setRawQuantity] = useState(1);

  const { getCartItemTotalQuantity, updateCartItem } = useCartStore(
    (state) => state,
  );

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const cartItemTotalQuantity = getCartItemTotalQuantity(id);
  const itemStockLeft =
    availability === "SoldOut" ? 0 : stock === null ? Infinity : stock;

  const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
  const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;

  const availableToAdd = Math.min(perItemCapLeft, itemStockCapLeft);
  const minQuantity = availableToAdd > 0 ? 1 : 0;
  const clampQuantity = (value: number) =>
    Math.max(Math.min(value, availableToAdd), minQuantity);
  const quantity = clampQuantity(rawQuantity);

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  useEffect(() => {
    setDialog({ confirmDisabled: quantity <= 0 });
  }, [quantity, setDialog]);

  const amount = price * quantity;
  const displayPrice = amount.toLocaleString(locale);

  const isAtLimit = quantity >= availableToAdd;

  const formHelperText =
    perItemCapLeft === availableToAdd
      ? tCommon("maxQuantity", { quantity: MAX_QUANTITY })
      : tDialog("maxStock", {
          label: "",
          quantity: availableToAdd,
        });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (quantity <= 0) return;

    updateCartItem({
      id,
      amount,
      extraCost: 0,
      image: image || null,
      price,
      quantity,
      choices: {},
    });

    closeDialog();
  };

  return (
    <FormBox id="add-to-cart-form" onSubmit={handleSubmit}>
      <ImageBox>
        {image ? (
          <Image
            alt={name}
            draggable={false}
            fill
            sizes="(min-width: 808px) 50vw, 100vw"
            src={image}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <StyledRestaurantMenu color="disabled" />
        )}
      </ImageBox>
      {description && (
        <WrapTypography color="text.secondary" variant="body2">
          {description}
        </WrapTypography>
      )}
      {suitableForDiet && suitableForDiet.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {suitableForDiet.map((diet) => (
            <Chip
              key={diet}
              label={tOrder(`menuItem.diet.${diet}`)}
              size="small"
            />
          ))}
        </Stack>
      )}
      {nutrition?.calories && (
        <Typography color="text.secondary" variant="caption">
          {tOrder("menuItem.calories", { value: nutrition.calories })}
        </Typography>
      )}
      {leadTime !== undefined && (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <AccessTime color="disabled" fontSize="small" />
          <Typography color="text.secondary" variant="caption">
            {tOrder("menuItem.preparationTime", { value: leadTime })}
          </Typography>
        </Stack>
      )}
      <Divider variant="inset" />
      <Grid
        width="100%"
        container
        display="flex"
        alignItems="center"
        spacing={2}
      >
        <Grid size={{ xs: 5 }}>
          <Stack>
            {promoInfo && (
              <OriginalPriceTypography
                color="text.disabled"
                isPromo
                variant="caption"
              >
                {`${priceCurrency} ${basePrice.toLocaleString(locale)}`}
              </OriginalPriceTypography>
            )}
            <Typography
              color={promoInfo ? "error" : "primary"}
              component="span"
              fontWeight="bold"
              variant="h6"
            >
              {priceCurrency} {displayPrice}
            </Typography>
            {promoInfo?.validThrough && (
              <Typography color="error" variant="caption">
                {tOrder("menuItem.promoUntil", {
                  date: promoInfo.validThrough.toLocaleDateString(locale, {
                    month: "numeric",
                    day: "numeric",
                  }),
                })}
              </Typography>
            )}
            {stock !== null && (
              <Typography color="text.secondary" variant="caption">
                {tOrder("menuItem.stockLeft", {
                  stock: [stock, stockUnit].filter(Boolean).join(" "),
                })}
              </Typography>
            )}
          </Stack>
        </Grid>
        <Grid size={{ xs: 7 }}>
          <NumberSpinner
            disabled={!quantity}
            error={isAtLimit}
            fullWidth
            helperText={isAtLimit ? formHelperText : undefined}
            max={availableToAdd}
            min={minQuantity}
            onValueChange={(value) => setRawQuantity(value || minQuantity)}
            value={quantity}
          />
        </Grid>
      </Grid>
    </FormBox>
  );
};

export default CardDialogContent;
