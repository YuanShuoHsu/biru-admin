import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import CartItemSoldOut from "./CartItemSoldOut";

import { MAX_QUANTITY } from "@/constants/cart";

import { Add, Delete, Remove } from "@mui/icons-material";
import {
  Box,
  Grid,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import { type CartItem } from "@/stores/cart-store";

import {
  getChoiceNames,
  getItemName,
  getItemStock,
  getLimitingChoicesCap,
} from "@/utils/menu";

const StyledListItem = styled(ListItem)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(2),
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

const StyledInputAdornment = styled(InputAdornment)({
  margin: 0,
});

interface CartItemRowProps {
  forceXsLayout: boolean;
  item: CartItem;
}

const CartItemRow = ({ forceXsLayout, item }: CartItemRowProps) => {
  const { id, amount, choices, extraCost, image, price, quantity } = item;

  const locale = useLocale();

  const { menus } = useMenuStore((state) => state);

  const tCommon = useTranslations("common");

  const itemName = getItemName(menus, id);
  const choiceNames = getChoiceNames(menus, id, choices, {
    colon: tCommon("colon"),
    delimiter: tCommon("delimiter"),
  });

  const {
    deleteCartItem,
    getCartItemTotalQuantity,
    getChoiceAvailableQuantity,
    updateCartItem,
  } = useCartStore((state) => state);

  const itemStock = getItemStock(menus, id);
  const itemStockLeft = itemStock === null ? Infinity : itemStock;
  const cartItemTotalQuantity = getCartItemTotalQuantity(id);

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

  const formHelperText =
    perItemCapLeft === availableToAdd
      ? tCommon("maxQuantity", { quantity: MAX_QUANTITY })
      : itemStockCapLeft === availableToAdd
        ? tCommon("reachStockLimit", { label: "" })
        : optionCapLeft === availableToAdd
          ? tCommon("reachStockLimit", { label: limitingChoicesLabel })
          : "";

  const canDecrease = quantity > 1;
  const canIncrease = availableToAdd > 0;

  const handleDecrease = () => {
    if (canDecrease) {
      updateCartItem({
        ...item,
        quantity: -1,
        amount: -(price + extraCost),
      });
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      updateCartItem({
        ...item,
        quantity: 1,
        amount: price + extraCost,
      });
    }
  };

  return (
    <StyledListItem disablePadding>
      <CartItemSoldOut
        availableToAdd={availableToAdd}
        item={item}
        itemStockCapLeft={itemStockCapLeft}
        limitingChoicesLabel={limitingChoicesLabel}
        optionCapLeft={optionCapLeft}
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
            {tCommon("currency")} {amount.toLocaleString(locale)}
          </Typography>
        </Grid>
        <Grid
          size={{
            xs: 7,
            ...(forceXsLayout ? {} : { sm: 4 }),
          }}
        >
          <TextField
            disabled={!quantity}
            fullWidth
            helperText={!canIncrease ? formHelperText : undefined}
            size="small"
            slotProps={{
              formHelperText: {
                error: !canIncrease,
                sx: { textAlign: "right" },
              },
              htmlInput: {
                sx: { textAlign: "center" },
              },
              input: {
                startAdornment: (
                  <StyledInputAdornment position="start">
                    <IconButton
                      aria-label={canDecrease ? "decrease" : "delete"}
                      onClick={() =>
                        canDecrease ? handleDecrease() : deleteCartItem(item)
                      }
                      size="small"
                    >
                      {canDecrease ? (
                        <Remove fontSize="small" />
                      ) : (
                        <Delete fontSize="small" />
                      )}
                    </IconButton>
                  </StyledInputAdornment>
                ),
                endAdornment: (
                  <StyledInputAdornment position="end">
                    <IconButton
                      aria-label="increase"
                      disabled={!canIncrease}
                      onClick={handleIncrease}
                      size="small"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </StyledInputAdornment>
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
    </StyledListItem>
  );
};

export default CartItemRow;
