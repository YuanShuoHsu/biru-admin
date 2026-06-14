import { useTranslations } from "next-intl";

import { Delete, Edit } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";

import type { CartItem } from "@/stores/cart-store";

import { getTypographyVariant } from "@/utils/soldOut";

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "inStock",
})<{ inStock: boolean }>(({ inStock, theme }) => ({
  position: "absolute",
  inset: 0,
  backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.8)`,
  borderRadius: 0,
  opacity: inStock ? 0 : 1,
  pointerEvents: inStock ? "none" : "auto",
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "opacity",
  ]),
  zIndex: 2,

  "&:hover": {
    backgroundColor: `rgba(${theme.vars.palette.error.mainChannel} / 0.2)`,
  },
}));

const StyledBox = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  width: theme.spacing(4),
  height: theme.spacing(4),
  backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.8)`,
  border: `1px solid ${theme.vars.palette.error.main}`,
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  transition: theme.transitions.create("background-color"),
}));

const StyledTypography = styled(Typography)({
  whiteSpace: "pre-line",
  wordBreak: "break-word",
  transform: "rotate(-30deg)",
});

interface CartItemSoldOutProps {
  addOnCapLeft: number;
  availableToAdd: number;
  item: CartItem;
  itemStockCapLeft: number;
  limitingAddOnsLabel: string;
  unavailable: boolean;
}

const CartItemSoldOut = ({
  addOnCapLeft,
  availableToAdd,
  item,
  itemStockCapLeft,
  limitingAddOnsLabel,
  unavailable,
}: CartItemSoldOutProps) => {
  const { quantity } = item;

  const { addCartItem, deleteCartItem } = useCartStore((state) => state);

  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  const targetQuantity = quantity + availableToAdd;
  const shouldDeleteItem = availableToAdd < 0 && targetQuantity <= 0;
  const shouldEditItem = availableToAdd < 0 && targetQuantity > 0;
  const showOverlay = shouldDeleteItem || shouldEditItem;

  const message = shouldDeleteItem
    ? unavailable
      ? tCommon("unavailable")
      : itemStockCapLeft === availableToAdd
        ? tCommon("soldOut", { label: "" })
        : addOnCapLeft === availableToAdd
          ? tCommon("soldOut", { label: `${limitingAddOnsLabel}\n` })
          : ""
    : shouldEditItem
      ? itemStockCapLeft === availableToAdd
        ? tCart("quantityExceedsStock", { label: "", stock: targetQuantity })
        : addOnCapLeft === availableToAdd
          ? tCart("quantityExceedsStock", {
              label: `${limitingAddOnsLabel}\n`,
              stock: targetQuantity,
            })
          : ""
      : "";

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!showOverlay) return;

    if (shouldDeleteItem) {
      deleteCartItem(item);
      return;
    }

    if (shouldEditItem) {
      addCartItem({ ...item, quantity: availableToAdd });
    }
  };

  return (
    <StyledButton
      aria-label={message}
      color="error"
      disabled={!showOverlay}
      inStock={!showOverlay}
      onClick={handleClick}
      variant="outlined"
    >
      <StyledBox>
        {shouldDeleteItem ? (
          <Delete fontSize="small" />
        ) : (
          <Edit fontSize="small" />
        )}
      </StyledBox>
      {message && (
        <StyledTypography
          color="error"
          fontWeight="bold"
          variant={getTypographyVariant(message)}
        >
          {message}
        </StyledTypography>
      )}
    </StyledButton>
  );
};

export default CartItemSoldOut;
