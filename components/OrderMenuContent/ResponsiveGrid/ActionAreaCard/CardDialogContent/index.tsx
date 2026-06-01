import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useImperativeHandle, useState } from "react";

import { MAX_QUANTITY } from "@/constants/cart";

import { Add, Remove } from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu, Option } from "@/types/menu";

import { getLimitingChoicesCap } from "@/utils/menus";

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  aspectRatio: "4/3",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export interface CardDialogContentImperativeHandle {
  getValues: () => {
    amount: number;
    extraCost: number;
    price: number;
    quantity: number;
    choices: Record<string, string[]>;
  };
}

interface CardDialogContentProps {
  id: string;
  name: string;
  description: string;
  image: string | null;
  menus: Menu[];
  options: Option[];
  price: number;
  stock: number | null;
}

const CardDialogContent = React.forwardRef<
  CardDialogContentImperativeHandle,
  CardDialogContentProps
>(({ id, name, description, image, menus, options, price, stock }, ref) => {
  const [rawQuantity, setRawQuantity] = useState(1);

  const { getCartItemTotalQuantity, getChoiceAvailableQuantity } = useCartStore(
    (state) => state,
  );

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

  const { setDialog } = useDialogStore((state) => state);

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

  useImperativeHandle(
    ref,
    () => ({
      getValues: () => ({
        amount,
        extraCost,
        price,
        quantity,
        choices,
      }),
    }),
    [amount, extraCost, price, quantity, choices],
  );

  const handleDecreaseQuantity = () =>
    setRawQuantity((prev) => clampQuantity(prev - 1));

  const handleIncreaseQuantity = () =>
    setRawQuantity((prev) => clampQuantity(prev + 1));

  return (
    <Stack direction="column" gap={2}>
      <ImageBox>
        {image && (
          <Image
            alt={name}
            draggable={false}
            fill
            sizes="(min-width: 808px) 50vw, 100vw"
            src={image}
            style={{ objectFit: "cover" }}
          />
        )}
      </ImageBox>
      {description && (
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
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
                                  {tCommon("currency")} {extraCost}
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
      <Grid container display="flex" alignItems="center" spacing={2}>
        <Grid size={{ xs: 5 }}>
          <Typography
            color="primary"
            component="span"
            fontWeight="bold"
            variant="h6"
          >
            {tCommon("currency")} {displayPrice}
          </Typography>
        </Grid>
        <Grid size={{ xs: 7 }}>
          <TextField
            disabled={!quantity}
            fullWidth
            helperText={isAtLimit ? formHelperText : undefined}
            size="small"
            slotProps={{
              formHelperText: {
                error: isAtLimit,
                sx: { textAlign: "right" },
              },
              htmlInput: {
                sx: { textAlign: "center" },
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      aria-label="decrease"
                      disabled={quantity <= minQuantity}
                      onClick={handleDecreaseQuantity}
                      size="small"
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="increase"
                      disabled={quantity >= availableToAdd}
                      onClick={handleIncreaseQuantity}
                      size="small"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                readOnly: true,
                sx: {
                  paddingInline: 1,
                },
              },
            }}
            value={quantity}
          />
        </Grid>
      </Grid>
    </Stack>
  );
});

CardDialogContent.displayName = "CardDialogContent";

export default CardDialogContent;
