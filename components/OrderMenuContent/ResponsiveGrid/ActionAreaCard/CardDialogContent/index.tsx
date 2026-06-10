import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { MAX_QUANTITY } from "@/constants/cart";

import { RestaurantMenu } from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrderMenu, OrderMenuItem } from "@/types/menus";

import type { Option } from "@/utils/menus";
import { getLimitingChoicesCap } from "@/utils/menus";

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

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

interface CardDialogContentProps {
  menuItem: OrderMenuItem;
  menus: OrderMenu[];
  options: Option[];
}

const CardDialogContent = ({
  menuItem,
  menus,
  options,
}: CardDialogContentProps) => {
  const { id, name, description, image, offers } = menuItem;
  const offer = offers[0];
  const price = parseFloat(offer?.price ?? "0") || 0;
  const priceCurrency = offer?.priceCurrency;
  const stock = offer?.inventoryLevel?.value ?? null;
  const [rawQuantity, setRawQuantity] = useState(1);

  const {
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
    updateCartItem,
  } = useCartStore((state) => state);

  const initialChoices = options.reduce<Record<string, string[]>>(
    (acc, { id: optionId, choices: optionChoices, multiple, required }) => {
      if (multiple) {
        acc[optionId] = [];
      } else if (required) {
        const firstInStock = optionChoices.find(
          ({ id: choiceId, stock: choiceStock, isShared }) => {
            const choiceAvailableQuantity = getChoiceAvailableQuantity(
              choiceId,
              choiceStock,
              isShared,
              id,
            );

            return choiceAvailableQuantity > 0;
          },
        );

        acc[optionId] = firstInStock ? [firstInStock.id] : [];
      } else acc[optionId] = [];

      return acc;
    },
    {},
  );

  const [choices, setChoices] =
    useState<Record<string, string[]>>(initialChoices);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");

  const cartItemTotalQuantity = getCartItemTotalQuantity(id);
  const itemStockLeft = stock === null ? Infinity : stock;

  const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
  const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;

  const { names: limitingChoiceNames, cap: optionCapLeft } =
    getLimitingChoicesCap(menus, id, choices, getChoiceAvailableQuantity);

  const limitingChoicesLabel =
    limitingChoiceNames.length > 0
      ? limitingChoiceNames.join(tCommon("delimiter"))
      : "";

  const availableToAdd = Math.min(
    perItemCapLeft,
    itemStockCapLeft,
    optionCapLeft,
  );
  const minQuantity = availableToAdd > 0 ? 1 : 0;
  const clampQuantity = (value: number) =>
    Math.max(Math.min(value, availableToAdd), minQuantity);
  const quantity = clampQuantity(rawQuantity);

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  useEffect(() => {
    setDialog({ confirmDisabled: quantity <= 0 });
  }, [quantity, setDialog]);

  const extraCost = options.reduce(
    (total, { id: optionId, choices: optionChoices }) => {
      const choiceIds = choices[optionId];
      if (!choiceIds.length) return total;

      const choiceIdSet = new Set(choiceIds);

      const cost = optionChoices.reduce(
        (sum, { id: choiceId, extraCost }) =>
          choiceIdSet.has(choiceId) ? sum + extraCost : sum,
        0,
      );

      return total + cost;
    },
    0,
  );

  const amount = (price + extraCost) * quantity;
  const displayPrice = amount.toLocaleString(locale);

  const isAtLimit = quantity >= availableToAdd;

  const formHelperText =
    perItemCapLeft === availableToAdd
      ? tCommon("maxQuantity", { quantity: MAX_QUANTITY })
      : itemStockCapLeft === availableToAdd
        ? tDialog("maxStock", {
            label: "",
            quantity: availableToAdd,
          })
        : optionCapLeft === availableToAdd
          ? tDialog("maxStock", {
              label: limitingChoicesLabel,
              quantity: availableToAdd,
            })
          : "";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (quantity <= 0) return;

    updateCartItem({
      id,
      amount,
      extraCost,
      image: image || null,
      price,
      quantity,
      choices,
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
      {options.map(
        ({
          id: optionId,
          name: optionName,
          choices: optionChoices,
          multiple,
        }) => {
          const filteredOptionChoices = optionChoices.filter(
            ({ isActive }) => isActive,
          );
          if (filteredOptionChoices.length === 0) return null;

          const choiceIds = choices[optionId];
          const choiceIdSet = new Set(choiceIds);

          return (
            <StyledFormControl key={optionId}>
              <FormLabel>{optionName}</FormLabel>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {filteredOptionChoices.map(
                  ({
                    id: choiceId,
                    name: choiceName,
                    extraCost,
                    isShared,
                    stock: choiceStock,
                  }) => {
                    const choiceAvailableQuantity = getChoiceAvailableQuantity(
                      choiceId,
                      choiceStock,
                      isShared,
                      id,
                    );
                    const isChoiceOutOfStock = choiceAvailableQuantity === 0;

                    const isSelected = choiceIdSet.has(choiceId);

                    const handleClick = () => {
                      if (isChoiceOutOfStock) return;

                      setChoices((prev) => {
                        const current = prev[optionId];

                        if (multiple) {
                          const next = isSelected
                            ? current.filter((id) => id !== choiceId)
                            : [...current, choiceId];

                          return { ...prev, [optionId]: next };
                        }

                        return {
                          ...prev,
                          [optionId]: [choiceId],
                        };
                      });
                    };

                    return (
                      <Chip
                        clickable
                        color={
                          !isChoiceOutOfStock && isSelected
                            ? "primary"
                            : "default"
                        }
                        disabled={isChoiceOutOfStock}
                        key={choiceId}
                        label={
                          <Stack
                            flexDirection="row"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography component="span" variant="body2">
                              {choiceName}
                            </Typography>
                            {extraCost > 0 && (
                              <>
                                <Typography component="span" variant="body2">
                                  /
                                </Typography>
                                <Typography component="span" variant="caption">
                                  {priceCurrency} {extraCost}
                                </Typography>
                              </>
                            )}
                          </Stack>
                        }
                        onClick={handleClick}
                      />
                    );
                  },
                )}
              </Stack>
            </StyledFormControl>
          );
        },
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
          <Typography
            color="primary"
            component="span"
            fontWeight="bold"
            variant="h6"
          >
            {priceCurrency} {displayPrice}
          </Typography>
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
