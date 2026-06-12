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
  FormHelperText,
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

import type { CartItem } from "@/stores/cart-store";

import type { OrderMenuItem, OrderMenuModifierGroup } from "@/types/menus";

import {
  ADD_ON_OPTION_ID,
  getActivePromo,
  getAddOnItems,
  getAddOnPrice,
  getAddOnsCap,
  hasUnsatisfiableModifierGroup,
  isLowStock,
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
  cartItem?: CartItem;
  menuItem: OrderMenuItem;
}

const CardDialogContent = ({ cartItem, menuItem }: CardDialogContentProps) => {
  const {
    id,
    name,
    description,
    image,
    offers,
    suitableForDiet,
    nutrition,
    modifierGroups,
  } = menuItem;
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

  const [rawQuantity, setRawQuantity] = useState(cartItem?.quantity || 1);
  const [choices, setChoices] = useState<Record<string, string[]>>(() =>
    cartItem
      ? {
          ...cartItem.modifiers,
          [ADD_ON_OPTION_ID]: cartItem.addOns.map(({ id }) => id),
        }
      : {},
  );
  const [addOnChoices, setAddOnChoices] = useState<
    Record<string, Record<string, string[]>>
  >(() =>
    cartItem
      ? Object.fromEntries(
          cartItem.addOns.map(({ id, modifiers }) => [id, modifiers]),
        )
      : {},
  );

  const {
    deleteCartItem,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
    updateCartItem,
  } = useCartStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const addOnItems = useMemo(() => getAddOnItems(menuItem), [menuItem]);

  const selectedAddOnIds = choices[ADD_ON_OPTION_ID] ?? [];
  const selectedAddOnItems = addOnItems.filter(({ id }) =>
    selectedAddOnIds.includes(id),
  );

  const getGroupsExtraCost = (
    groups: OrderMenuModifierGroup[],
    selections: Record<string, string[]>,
  ) =>
    groups.reduce((sum, { id, modifiers }) => {
      const selected = selections[id] ?? [];

      return (
        sum +
        modifiers.reduce(
          (groupSum, { id, priceAdjustment }) =>
            selected.includes(id)
              ? groupSum + Number(priceAdjustment || 0)
              : groupSum,
          0,
        )
      );
    }, 0);

  const modifierExtraCost = getGroupsExtraCost(modifierGroups, choices);

  const addOnExtraCost = selectedAddOnItems.reduce(
    (sum, addOnItem) =>
      sum +
      getAddOnPrice(addOnItem) +
      getGroupsExtraCost(
        addOnItem.modifierGroups,
        addOnChoices[addOnItem.id] ?? {},
      ),
    0,
  );

  const extraCost = modifierExtraCost + addOnExtraCost;

  const isGroupSelectionValid = (
    { id, minSelectionCount, maxSelectionCount }: OrderMenuModifierGroup,
    selections: Record<string, string[]>,
  ) => {
    const selectedCount = (selections[id] ?? []).length;

    return (
      selectedCount >= minSelectionCount &&
      (maxSelectionCount == null || selectedCount <= maxSelectionCount)
    );
  };

  const isSelectionValid =
    modifierGroups.every((group) => isGroupSelectionValid(group, choices)) &&
    selectedAddOnItems.every((addOnItem) =>
      addOnItem.modifierGroups.every((group) =>
        isGroupSelectionValid(group, addOnChoices[addOnItem.id] ?? {}),
      ),
    );

  const editingQuantity = cartItem?.quantity || 0;
  const cartItemTotalQuantity = getCartItemTotalQuantity(id) - editingQuantity;
  const itemStockLeft =
    availability === "SoldOut" ? 0 : stock === null ? Infinity : stock;

  const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
  const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;

  const { names: limitingAddOnNames, cap: addOnCapLeft } = getAddOnsCap(
    selectedAddOnItems,
    (choiceId, choiceStock) =>
      getChoiceAvailableQuantity(choiceId, choiceStock) +
      (cartItem?.addOns.some(({ id }) => id === choiceId)
        ? editingQuantity
        : 0),
  );

  const availableToAdd = Math.min(
    perItemCapLeft,
    itemStockCapLeft,
    addOnCapLeft,
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

  const limitingAddOnsLabel =
    limitingAddOnNames.length > 0
      ? limitingAddOnNames.join(tCommon("delimiter"))
      : "";

  const formHelperText =
    perItemCapLeft === availableToAdd
      ? tCommon("maxQuantity", { quantity: MAX_QUANTITY })
      : itemStockCapLeft === availableToAdd
        ? tDialog("maxStock", {
            label: "",
            quantity: availableToAdd,
          })
        : tCommon("reachStockLimit", { label: limitingAddOnsLabel });

  const toggleChoice = (
    selected: string[],
    choiceId: string,
    checked: boolean,
  ) =>
    checked
      ? [...selected, choiceId]
      : selected.filter((id) => id !== choiceId);

  const handleAddOnToggle = (addOnId: string, checked: boolean) =>
    setChoices((prev) => ({
      ...prev,
      [ADD_ON_OPTION_ID]: toggleChoice(
        prev[ADD_ON_OPTION_ID] ?? [],
        addOnId,
        checked,
      ),
    }));

  const handleChoicesChange = (groupId: string, next: string[]) =>
    setChoices((prev) => ({ ...prev, [groupId]: next }));

  const handleAddOnChoicesChange =
    (addOnId: string) => (groupId: string, next: string[]) =>
      setAddOnChoices((prev) => ({
        ...prev,
        [addOnId]: { ...(prev[addOnId] ?? {}), [groupId]: next },
      }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (quantity <= 0 || !isSelectionValid) return;

    const modifiers = Object.fromEntries(
      Object.entries(choices).filter(([key]) => key !== ADD_ON_OPTION_ID),
    );
    const addOns = selectedAddOnItems.map(({ id }) => ({
      id,
      modifiers: addOnChoices[id] ?? {},
    }));

    if (cartItem) deleteCartItem(cartItem);

    updateCartItem({
      menuItemId: id,
      amount,
      extraCost,
      image: image || null,
      price,
      quantity,
      modifiers,
      addOns,
    });

    closeDialog();
  };

  const renderChoiceLabel = (
    choiceName: string,
    choiceExtraCost: number,
    soldOut: boolean,
  ) => (
    <Stack direction="row" alignItems="center" gap={1}>
      <WrapTypography variant="body2">{choiceName}</WrapTypography>
      {choiceExtraCost !== 0 && (
        <Typography color="text.secondary" variant="caption">
          {choiceExtraCost > 0 ? "+" : "-"}
          {priceCurrency} {Math.abs(choiceExtraCost).toLocaleString(locale)}
        </Typography>
      )}
      {soldOut && (
        <Typography color="error" variant="caption">
          {tCommon("soldOut")}
        </Typography>
      )}
    </Stack>
  );

  const renderModifierGroupHint = ({
    minSelectionCount,
    maxSelectionCount,
  }: OrderMenuModifierGroup) => {
    const hints = [
      ...(minSelectionCount > 1
        ? [tOrder("menuItem.selectAtLeast", { count: minSelectionCount })]
        : []),
      ...(maxSelectionCount != null && maxSelectionCount !== 1
        ? [tOrder("menuItem.selectUpTo", { count: maxSelectionCount })]
        : []),
    ];

    if (hints.length === 0) return null;

    return <FormHelperText>{hints.join(tCommon("delimiter"))}</FormHelperText>;
  };

  const renderModifierGroup = (
    group: OrderMenuModifierGroup,
    selections: Record<string, string[]>,
    onGroupChange: (groupId: string, next: string[]) => void,
  ) => {
    const {
      id: groupId,
      displayName,
      minSelectionCount,
      maxSelectionCount,
      modifiers,
    } = group;
    const selected = selections[groupId] ?? [];
    const atMax =
      maxSelectionCount != null && selected.length >= maxSelectionCount;

    return (
      <FormControl
        key={groupId}
        component="fieldset"
        error={!isGroupSelectionValid(group, selections)}
        fullWidth
        required={minSelectionCount >= 1}
        variant="standard"
      >
        <FormLabel component="legend">{displayName}</FormLabel>
        {minSelectionCount === 1 && maxSelectionCount === 1 ? (
          <RadioGroup
            value={selected[0] || ""}
            onChange={(event) => onGroupChange(groupId, [event.target.value])}
          >
            {modifiers.map(
              ({ id, displayName, priceAdjustment, availability }) => (
                <FormControlLabel
                  key={id}
                  control={<Radio size="small" />}
                  disabled={availability === "SoldOut"}
                  label={renderChoiceLabel(
                    displayName,
                    Number(priceAdjustment || 0),
                    availability === "SoldOut",
                  )}
                  value={id}
                />
              ),
            )}
          </RadioGroup>
        ) : (
          <FormGroup>
            {modifiers.map(
              ({ id, displayName, priceAdjustment, availability }) => {
                const checked = selected.includes(id);

                return (
                  <FormControlLabel
                    key={id}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) =>
                          onGroupChange(
                            groupId,
                            toggleChoice(selected, id, event.target.checked),
                          )
                        }
                        size="small"
                      />
                    }
                    disabled={availability === "SoldOut" || (!checked && atMax)}
                    label={renderChoiceLabel(
                      displayName,
                      Number(priceAdjustment || 0),
                      availability === "SoldOut",
                    )}
                  />
                );
              },
            )}
          </FormGroup>
        )}
        {renderModifierGroupHint(group)}
      </FormControl>
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
      {modifierGroups.map((group) =>
        renderModifierGroup(group, choices, handleChoicesChange),
      )}
      {addOnItems.length > 0 && (
        <FormControl component="fieldset" fullWidth variant="standard">
          <FormLabel component="legend">{tOrder("menuItem.addOn")}</FormLabel>
          <FormGroup>
            {addOnItems.map((addOnItem) => {
              const { id, name, offers, modifierGroups } = addOnItem;
              const soldOut =
                offers[0]?.availability === "SoldOut" ||
                hasUnsatisfiableModifierGroup(modifierGroups);
              const checked = selectedAddOnIds.includes(id);

              return (
                <Box key={id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) =>
                          handleAddOnToggle(id, event.target.checked)
                        }
                        size="small"
                      />
                    }
                    disabled={soldOut}
                    label={renderChoiceLabel(
                      name,
                      getAddOnPrice(addOnItem),
                      soldOut,
                    )}
                  />
                  {checked && modifierGroups.length > 0 && (
                    <Stack pl={4} gap={1}>
                      {modifierGroups.map((group) =>
                        renderModifierGroup(
                          group,
                          addOnChoices[id] ?? {},
                          handleAddOnChoicesChange(id),
                        ),
                      )}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </FormGroup>
        </FormControl>
      )}
      <Divider variant="inset" />
      <Grid
        width="100%"
        container
        display="flex"
        alignItems="center"
        spacing={2}
      >
        <Grid size={{ xs: 5 }} display="flex" flexDirection="column">
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
