import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import CartItemSoldOut from "./CartItemSoldOut";

import CardDialogContent from "@/components/CardDialogContent";
import NumberSpinner from "@/components/NumberSpinner";

import { MAX_QUANTITY } from "@/constants/cart";

import { Delete } from "@mui/icons-material";
import {
  Box,
  Grid,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import { type CartItem } from "@/stores/cart-store";

import {
  findItemById,
  getChoiceNames,
  getItemStock,
  getLimitingAddOnsCap,
} from "@/utils/menus";

const StyledListItem = styled(ListItem)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(2),
  cursor: "pointer",
  transition: theme.transitions.create("background-color"),

  "&:hover": {
    backgroundColor: theme.vars.palette.action.hover,
  },
}));

const StyledListItemAvatar = styled(ListItemAvatar)({
  margin: 0,
});

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: 60,
  height: 60,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  margin: 0,
  wordBreak: "break-word",
  whiteSpace: "pre-line",

  "& .MuiTypography-root": {
    transition: theme.transitions.create("color"),
  },
}));

interface CartItemRowProps {
  forceXsLayout: boolean;
  item: CartItem;
}

const CartItemRow = ({ forceXsLayout, item }: CartItemRowProps) => {
  const {
    menuItemId,
    amount,
    modifiers,
    addOns,
    extraCost,
    image,
    price,
    priceCurrency,
    quantity,
  } = item;

  const locale = useLocale();

  const { menu } = useMenuStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const menuItem = findItemById(menu, menuItemId);
  const itemName = menuItem?.name || "";
  const choiceNames = getChoiceNames(menu, menuItemId, modifiers, addOns, {
    addOnLabel: tOrder("menuItem.addOn"),
    colon: tCommon("colon"),
    delimiter: tCommon("delimiter"),
    parenthesisOpen: tCommon("parenthesisOpen"),
    parenthesisClose: tCommon("parenthesisClose"),
  });

  const {
    deleteCartItem,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
    updateCartItem,
  } = useCartStore((state) => state);

  const itemStock = getItemStock(menu, menuItemId);
  const itemStockLeft = itemStock === null ? Infinity : itemStock;
  const cartItemTotalQuantity = getCartItemTotalQuantity(menuItemId);

  const perItemCapLeft = MAX_QUANTITY - cartItemTotalQuantity;
  const itemStockCapLeft = itemStockLeft - cartItemTotalQuantity;

  const { names: limitingAddOnNames, cap: addOnCapLeft } = getLimitingAddOnsCap(
    menu,
    menuItemId,
    addOns,
    getChoiceAvailableQuantity,
  );

  const limitingAddOnsLabel =
    limitingAddOnNames.length > 0
      ? limitingAddOnNames.join(tCommon("delimiter"))
      : "";

  const availableToAdd = Math.min(
    perItemCapLeft,
    itemStockCapLeft,
    addOnCapLeft,
  );

  const formHelperText =
    perItemCapLeft === availableToAdd
      ? tCommon("maxQuantity", { quantity: MAX_QUANTITY })
      : itemStockCapLeft === availableToAdd
        ? tCommon("reachStockLimit", { label: "" })
        : addOnCapLeft === availableToAdd
          ? tCommon("reachStockLimit", { label: limitingAddOnsLabel })
          : "";

  const canIncrease = availableToAdd > 0;

  const handleValueChange = (value: number | null) => {
    if (value === null) return;

    if (value <= 0) {
      deleteCartItem(item);

      return;
    }

    const delta = value - quantity;

    if (delta) {
      updateCartItem({
        ...item,
        quantity: delta,
        amount: delta * (price + extraCost),
      });
    }
  };

  const handleEdit = () => {
    if (!menuItem || availableToAdd < 0) return;

    setDialog({
      cancelText: tDialog("close"),
      confirmText: tDialog("updateCart"),
      content: <CardDialogContent cartItem={item} menuItem={menuItem} />,
      formId: "add-to-cart-form",
      open: true,
      title: itemName,
    });
  };

  return (
    <StyledListItem disablePadding onClick={handleEdit}>
      <CartItemSoldOut
        addOnCapLeft={addOnCapLeft}
        availableToAdd={availableToAdd}
        item={item}
        itemStockCapLeft={itemStockCapLeft}
        limitingAddOnsLabel={limitingAddOnsLabel}
        unavailable={!itemName}
      />
      <Grid
        container
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Grid
          size={{
            xs: 12,
            ...(forceXsLayout ? {} : { sm: 6 }),
          }}
          display="flex"
          gap={2}
        >
          <StyledListItemAvatar>
            <ImageBox>
              {image && (
                <Image
                  alt={itemName}
                  draggable={false}
                  fill
                  sizes="(min-width: 808px) 50vw, 100vw"
                  src={image}
                  style={{ objectFit: "cover" }}
                />
              )}
            </ImageBox>
          </StyledListItemAvatar>
          <StyledListItemText primary={itemName} secondary={choiceNames} />
        </Grid>
        <Grid
          size={{
            xs: 5,
            ...(forceXsLayout ? {} : { sm: 2 }),
          }}
        >
          <Typography
            color="primary"
            component="span"
            fontWeight="bold"
            variant="body2"
          >
            {priceCurrency} {amount.toLocaleString(locale)}
          </Typography>
        </Grid>
        <Grid
          size={{
            xs: 7,
            ...(forceXsLayout ? {} : { sm: 4 }),
          }}
        >
          <NumberSpinner
            {...(quantity > 1
              ? {}
              : {
                  decrementAriaLabel: "Delete",
                  decrementIcon: <Delete fontSize="small" />,
                })}
            disabled={!quantity}
            error={!canIncrease}
            fullWidth
            helperText={!canIncrease ? formHelperText : undefined}
            max={quantity + availableToAdd}
            min={0}
            onValueChange={handleValueChange}
            size="small"
            value={quantity}
          />
        </Grid>
      </Grid>
    </StyledListItem>
  );
};

export default CartItemRow;
