import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Fragment, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type AddToCartFormInput, useAddToCartFormSchema } from "./definitions";

import CheckboxesGroup from "@/components/CheckboxesGroup";
import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";
import RadioButtonsGroup from "@/components/RadioButtonsGroup";

import { MAX_QUANTITY } from "@/constants/cart";

import { zodResolver } from "@hookform/resolvers/zod";

import { AccessTime, RestaurantMenu } from "@mui/icons-material";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
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
  getGroupsExtraCost,
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

const StyledNumberSpinner = styled(NumberSpinner)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    flex: 1,
  },
}));

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
  const stock = offer?.inventoryLevel?.value || null;
  const stockUnit = offer?.inventoryLevel?.unitText;
  const availability = offer?.availability;
  const leadTime = offer?.deliveryLeadTime?.value;

  const promoInfo = getActivePromo(offer);
  const price = promoInfo?.price || basePrice;
  const showLowStock = isLowStock(offer);

  const {
    addCartItem,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
    updateCartItem,
  } = useCartStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const addToCartFormSchema = useAddToCartFormSchema(menuItem);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<AddToCartFormInput>({
    defaultValues: {
      quantity: cartItem?.quantity || 1,
      choices: cartItem
        ? {
            ...cartItem.modifiers,
            [ADD_ON_OPTION_ID]: cartItem.addOns.map(({ id }) => id),
          }
        : {},
      addOnChoices: cartItem
        ? Object.fromEntries(
            cartItem.addOns.map(({ id, modifiers }) => [id, modifiers]),
          )
        : {},
    },
    resolver: zodResolver(addToCartFormSchema),
  });

  const [choices = {}, addOnChoices = {}, rawQuantity = 1] = useWatch({
    control,
    name: ["choices", "addOnChoices", "quantity"],
  });

  const addOnItems = useMemo(() => getAddOnItems(menuItem), [menuItem]);

  const selectedAddOnIds = choices[ADD_ON_OPTION_ID] || [];
  const selectedAddOnItems = addOnItems.filter(({ id }) =>
    selectedAddOnIds.includes(id),
  );

  const modifierExtraCost = getGroupsExtraCost(modifierGroups, choices);

  const addOnExtraCost = selectedAddOnItems.reduce(
    (sum, addOnItem) =>
      sum +
      getAddOnPrice(addOnItem) +
      getGroupsExtraCost(
        addOnItem.modifierGroups,
        addOnChoices[addOnItem.id] || {},
      ),
    0,
  );

  const extraCost = modifierExtraCost + addOnExtraCost;

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
        ? availableToAdd > 0
          ? tDialog("maxStock", {
              label: "",
              quantity: availableToAdd,
            })
          : itemStockLeft === 0
            ? tCommon("soldOut", { label: "" })
            : tCommon("reachStockLimit", { label: "" })
        : tCommon("reachStockLimit", { label: limitingAddOnsLabel });

  useEffect(() => {
    setDialog({ confirmDisabled: quantity <= 0 });
  }, [quantity, setDialog]);

  const handleChoicesChange = (groupId: string, next: string[]) =>
    setValue(`choices.${groupId}`, next, { shouldValidate: isSubmitted });

  const handleAddOnChoicesChange =
    (addOnId: string) => (groupId: string, next: string[]) =>
      setValue(`addOnChoices.${addOnId}.${groupId}`, next, {
        shouldValidate: isSubmitted,
      });

  const onSubmit = handleSubmit(({ choices, addOnChoices }) => {
    if (quantity <= 0) return;

    const modifiers = Object.fromEntries(
      Object.entries(choices).filter(([key]) => key !== ADD_ON_OPTION_ID),
    );
    const addOns = selectedAddOnItems.map(({ id }) => ({
      id,
      modifiers: addOnChoices[id] || {},
    }));

    const newItem = { menuItemId: id, quantity, modifiers, addOns };

    if (cartItem) {
      updateCartItem(cartItem, newItem);
    } else {
      addCartItem(newItem);
    }

    closeDialog();
  });

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
          {tCommon("soldOut", { label: "" })}
        </Typography>
      )}
    </Stack>
  );

  const getModifierGroupHint = ({
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

    return hints.length > 0 ? hints.join(tCommon("delimiter")) : null;
  };

  const renderModifierGroup = (
    group: OrderMenuModifierGroup,
    selections: Record<string, string[]>,
    onGroupChange: (groupId: string, next: string[]) => void,
    error?: { message?: string },
  ) => {
    const {
      id: groupId,
      displayName,
      minSelectionCount,
      maxSelectionCount,
      modifiers,
    } = group;
    const selected = selections[groupId] || [];
    const helperText = error?.message || getModifierGroupHint(group);

    const atMax =
      maxSelectionCount != null && selected.length >= maxSelectionCount;

    return minSelectionCount === 1 && maxSelectionCount === 1 ? (
      <RadioButtonsGroup
        key={groupId}
        error={!!error}
        fullWidth
        helperText={helperText}
        label={displayName}
        onChange={(event, next) => onGroupChange(groupId, [next])}
        options={modifiers.map(
          ({ availability, displayName, id, priceAdjustment }) => {
            const soldOut = availability === "SoldOut";

            return {
              disabled: soldOut,
              label: renderChoiceLabel(
                displayName,
                Number(priceAdjustment || 0),
                soldOut,
              ),
              value: id,
            };
          },
        )}
        required
        value={selected[0] || ""}
      />
    ) : (
      <CheckboxesGroup
        key={groupId}
        error={!!error}
        fullWidth
        helperText={helperText}
        label={displayName}
        onChange={(event, next) => onGroupChange(groupId, next)}
        options={modifiers.map(
          ({ availability, displayName, id, priceAdjustment }) => {
            const soldOut = availability === "SoldOut";

            return {
              children: null,
              disabled: soldOut || (!selected.includes(id) && atMax),
              label: renderChoiceLabel(
                displayName,
                Number(priceAdjustment || 0),
                soldOut,
              ),
              value: id,
            };
          },
        )}
        required={minSelectionCount >= 1}
        value={selected}
      />
    );
  };

  return (
    <FormBox id="add-to-cart-form" onSubmit={onSubmit}>
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
      <Divider flexItem />
      {modifierGroups.map((group, index) => (
        <Fragment key={group.id}>
          {index > 0 && <Divider flexItem variant="inset" />}
          {renderModifierGroup(
            group,
            choices,
            handleChoicesChange,
            errors.choices?.[group.id],
          )}
        </Fragment>
      ))}
      {modifierGroups.length > 0 && addOnItems.length > 0 && (
        <Divider flexItem variant="inset" />
      )}
      {addOnItems.length > 0 && (
        <CheckboxesGroup
          error={!!errors.choices?.[ADD_ON_OPTION_ID]}
          fullWidth
          helperText={errors.choices?.[ADD_ON_OPTION_ID]?.message}
          label={tOrder("menuItem.addOn")}
          onChange={(event, next) =>
            setValue(`choices.${ADD_ON_OPTION_ID}`, next)
          }
          options={addOnItems.map((addOnItem) => {
            const { id, name, offers, modifierGroups } = addOnItem;
            const soldOut =
              offers[0]?.availability === "SoldOut" ||
              hasUnsatisfiableModifierGroup(modifierGroups);
            const checked = selectedAddOnIds.includes(id);

            return {
              children: checked && modifierGroups.length > 0 && (
                <Stack pl={3} gap={2}>
                  {modifierGroups.map((group, index) => (
                    <Fragment key={group.id}>
                      {index > 0 && <Divider flexItem variant="inset" />}
                      {renderModifierGroup(
                        group,
                        addOnChoices[id] || {},
                        handleAddOnChoicesChange(id),
                        errors.addOnChoices?.[id]?.[group.id],
                      )}
                    </Fragment>
                  ))}
                </Stack>
              ),
              disabled: soldOut,
              label: renderChoiceLabel(name, getAddOnPrice(addOnItem), soldOut),
              value: id,
            };
          })}
          value={selectedAddOnIds}
        />
      )}
      {(modifierGroups.length > 0 || addOnItems.length > 0) && (
        <Divider flexItem />
      )}
      <Stack
        width="100%"
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={2}
      >
        <Stack direction="column" flex={1}>
          {promoInfo && (
            <OriginalPriceTypography
              color="text.disabled"
              fontWeight="bold"
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
        <StyledNumberSpinner
          disabled={!quantity}
          error={isAtLimit}
          fullWidth
          helperText={isAtLimit ? formHelperText : undefined}
          max={availableToAdd}
          min={minQuantity}
          onValueChange={(value) => setValue("quantity", value || minQuantity)}
          value={quantity}
        />
      </Stack>
    </FormBox>
  );
};

export default CardDialogContent;
