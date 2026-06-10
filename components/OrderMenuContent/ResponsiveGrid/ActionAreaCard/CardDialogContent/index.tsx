import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { MAX_QUANTITY } from "@/constants/cart";

import { AccessTime, RestaurantMenu } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrderMenuItem } from "@/types/menus";

import {
  getActivePromo,
  getChoicesCap,
  getItemOptions,
  getSelectedChoices,
  isLowStock,
  type Choice,
  type Option,
} from "@/utils/menus";

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
  const basePrice = Number(offer?.price || 0);
  const priceCurrency = offer?.priceCurrency;
  const stock = offer?.inventoryLevel?.value ?? null;
  const stockUnit = offer?.inventoryLevel?.unitText;
  const availability = offer?.availability;
  const leadTime = offer?.deliveryLeadTime?.value;

  const promoInfo = getActivePromo(offer);
  const price = promoInfo?.price ?? basePrice;
  const showLowStock = isLowStock(offer);

  const [rawQuantity, setRawQuantity] = useState(1);
  const [choices, setChoices] = useState<Record<string, string[]>>({});

  const {
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
    updateCartItem,
  } = useCartStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const options = useMemo(
    () => getItemOptions(menuItem, tOrder("menuItem.addOn")),
    [menuItem, tOrder],
  );

  const selectedChoices = getSelectedChoices(options, choices);

  const extraCost = selectedChoices.reduce(
    (sum, choice) => sum + choice.extraCost,
    0,
  );

  const isSelectionValid = options.every((option) => {
    const selectedCount = (choices[option.id] ?? []).length;

    return (
      selectedCount >= option.minSelections &&
      (option.maxSelections === null || selectedCount <= option.maxSelections)
    );
  });

  const cartItemTotalQuantity = getCartItemTotalQuantity(id);
  const itemStockLeft =
    availability === "SoldOut" ? 0 : stock === null ? Infinity : stock;

  const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
  const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;

  const { names: limitingChoiceNames, cap: optionCapLeft } = getChoicesCap(
    selectedChoices,
    id,
    getChoiceAvailableQuantity,
  );

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
    setDialog({ confirmDisabled: quantity <= 0 || !isSelectionValid });
  }, [quantity, isSelectionValid, setDialog]);

  const amount = (price + extraCost) * quantity;
  const displayPrice = amount.toLocaleString(locale);

  const isAtLimit = quantity >= availableToAdd;

  const limitingChoicesLabel =
    limitingChoiceNames.length > 0
      ? limitingChoiceNames.join(tCommon("delimiter"))
      : "";

  const formHelperText =
    perItemCapLeft === availableToAdd
      ? tCommon("maxQuantity", { quantity: MAX_QUANTITY })
      : itemStockCapLeft === availableToAdd
        ? tDialog("maxStock", {
            label: "",
            quantity: availableToAdd,
          })
        : tCommon("reachStockLimit", { label: limitingChoicesLabel });

  const handleSelect = (option: Option, choiceId: string, checked: boolean) => {
    setChoices((prev) => {
      const selected = prev[option.id] ?? [];
      const next = !option.multiple
        ? [choiceId]
        : checked
          ? [...selected, choiceId]
          : selected.filter((id) => id !== choiceId);

      return { ...prev, [option.id]: next };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (quantity <= 0 || !isSelectionValid) return;

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

  const renderChoiceLabel = (choice: Choice) => (
    <Stack direction="row" alignItems="center" gap={1}>
      <WrapTypography variant="body2">{choice.name}</WrapTypography>
      {choice.extraCost !== 0 && (
        <Typography color="text.secondary" variant="caption">
          {choice.extraCost > 0 ? "+" : "-"}
          {priceCurrency} {Math.abs(choice.extraCost).toLocaleString(locale)}
        </Typography>
      )}
      {!choice.isActive && (
        <Typography color="error" variant="caption">
          {tCommon("soldOut")}
        </Typography>
      )}
    </Stack>
  );

  const renderOptionHint = (option: Option) => {
    const hints = [
      ...(option.minSelections > 1
        ? [tOrder("menuItem.selectAtLeast", { count: option.minSelections })]
        : []),
      ...(option.multiple && option.maxSelections !== null
        ? [tOrder("menuItem.selectUpTo", { count: option.maxSelections })]
        : []),
    ];

    if (hints.length === 0) return null;

    return (
      <Typography color="text.secondary" variant="caption">
        {hints.join(tCommon("delimiter"))}
      </Typography>
    );
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
        <Stack
          direction="row"
          alignItems="center"
          alignSelf="flex-start"
          gap={0.5}
        >
          <AccessTime color="disabled" fontSize="small" />
          <Typography color="text.secondary" variant="caption">
            {tOrder("menuItem.preparationTime", { value: leadTime })}
          </Typography>
        </Stack>
      )}
      {options.map((option) => {
        const selected = choices[option.id] ?? [];
        const atMax =
          option.maxSelections !== null &&
          selected.length >= option.maxSelections;

        return (
          <FormControl key={option.id} required={option.required}>
            <FormLabel>{option.name}</FormLabel>
            {renderOptionHint(option)}
            {option.multiple ? (
              <FormGroup>
                {option.choices.map((choice) => {
                  const checked = selected.includes(choice.id);

                  return (
                    <FormControlLabel
                      key={choice.id}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(event) =>
                            handleSelect(
                              option,
                              choice.id,
                              event.target.checked,
                            )
                          }
                          size="small"
                        />
                      }
                      disabled={!choice.isActive || (!checked && atMax)}
                      label={renderChoiceLabel(choice)}
                    />
                  );
                })}
              </FormGroup>
            ) : (
              <RadioGroup
                value={selected[0] ?? ""}
                onChange={(event) =>
                  handleSelect(option, event.target.value, true)
                }
              >
                {option.choices.map((choice) => (
                  <FormControlLabel
                    key={choice.id}
                    control={<Radio size="small" />}
                    disabled={!choice.isActive}
                    label={renderChoiceLabel(choice)}
                    value={choice.id}
                  />
                ))}
              </RadioGroup>
            )}
          </FormControl>
        );
      })}
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
            {showLowStock && (
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
