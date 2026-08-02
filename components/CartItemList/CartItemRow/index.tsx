import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";

import CartItemSoldOut from "./CartItemSoldOut";

import CardDialogContent from "@/components/CardDialogContent";
import NumberSpinner from "@/components/NumberSpinner";

import { MAX_QUANTITY } from "@/constants/cart";
import { API_ORDER_MODE } from "@/constants/orderMode";

import { Delete, RestaurantMenu } from "@mui/icons-material";
import {
  Box,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
  TypographyProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import { type CartItem } from "@/stores/cart-store";

import type { RouteParams } from "@/types/routeParams";

import {
  calcCartItemAmount,
  findItemById,
  getChoiceNames,
  getItemStock,
  getLimitingAddOnsCap,
  hasUnavailableChoices,
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
  flex: 1,
  aspectRatio: "16/9",
  minWidth: 0,
});

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
}));

const StyledRestaurantMenu = styled(RestaurantMenu)(({ theme }) => ({
  fontSize: theme.spacing(4),
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  margin: 0,
  flex: 1,
  wordBreak: "break-word",
  whiteSpace: "pre-line",

  "& .MuiTypography-root": {
    transition: theme.transitions.create("color"),
  },
}));

const StyledTypography = styled(Typography)<TypographyProps>({
  flex: 1,
});

const StyledNumberSpinner = styled(NumberSpinner)({
  flex: 1,
});

interface CartItemRowProps {
  compact?: boolean;
  item: CartItem;
}

const CartItemRow = ({ compact = false, item }: CartItemRowProps) => {
  const { menuItemId, modifiers, addOns, quantity } = item;

  const locale = useLocale();

  const { mode } = useParams<RouteParams<"mode">>();
  const apiMode = API_ORDER_MODE[mode];

  const { menu } = useMenuStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const menuItem = findItemById(menu, menuItemId);
  const itemName = menuItem?.name || "";
  const offer = menuItem?.offers[0];
  const image = menuItem?.image || null;
  const priceCurrency = offer?.priceCurrency || "";
  const amount = calcCartItemAmount(menu, item);
  const choiceNames = getChoiceNames(menu, menuItemId, modifiers, addOns, {
    addOnLabel: tOrder("menuItem.addOn"),
    colon: tCommon("colon"),
    delimiter: tCommon("delimiter"),
    parenthesisOpen: tCommon("parenthesisOpen"),
    parenthesisClose: tCommon("parenthesisClose"),
  });

  const {
    addCartItem,
    deleteCartItem,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
  } = useCartStore((state) => state);

  const itemStock = getItemStock(menu, menuItemId, apiMode);
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

  const unavailableLabel =
    menuItem &&
    (!menuItem.availableModes.includes(apiMode) ||
      hasUnavailableChoices(menu, item, apiMode))
      ? tOrder(`mode.${apiMode}.unavailable`)
      : "";

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
      addCartItem({ ...item, quantity: delta });
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
        discontinued={offer?.availability === "Discontinued" || !menuItem}
        item={item}
        itemStockCapLeft={itemStockCapLeft}
        limitingAddOnsLabel={limitingAddOnsLabel}
        unavailableLabel={unavailableLabel}
      />
      <Stack width="100%" gap={2}>
        <Stack direction="row" gap={2}>
          <StyledListItemAvatar>
            <ImageBox>
              {image ? (
                <Image
                  alt={itemName}
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
          </StyledListItemAvatar>
          <StyledListItemText primary={itemName} secondary={choiceNames} />
        </Stack>
        <Stack
          alignItems={compact ? "center" : "stretch"}
          direction={compact ? "row" : "column"}
          gap={2}
        >
          <StyledTypography
            color="primary"
            component="span"
            fontWeight="bold"
            variant="body2"
          >
            {priceCurrency} {amount.toLocaleString(locale)}
          </StyledTypography>
          <StyledNumberSpinner
            {...(quantity <= 1 && {
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
        </Stack>
      </Stack>
    </StyledListItem>
  );
};

export default CartItemRow;
