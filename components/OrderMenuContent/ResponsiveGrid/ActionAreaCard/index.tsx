import { useTranslations } from "next-intl";
import Image from "next/image";

import CardDialogContent from "./CardDialogContent";
import ItemSoldOut from "./ItemSoldOut";

import { ViewDirections } from "@/constants/view";

import { RestaurantMenu } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { type CSSObject, styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";
import { useViewStore } from "@/providers/view-store-provider";

import type { OrderMenuItem } from "@/types/menus";
import type { ViewDirection } from "@/types/view";

import { getActivePromo, isLowStock } from "@/utils/menus";

const StyledCard = styled(Card)({
  width: "100%",
});

const StyledCardActionArea = styled(CardActionArea, {
  shouldForwardProp: (prop) => prop !== "inStock" && prop !== "viewDirection",
})<{ inStock: boolean; viewDirection: ViewDirection }>(
  ({ inStock, viewDirection }) => ({
    height: "100%",
    display: "flex",
    flexDirection: viewDirection,
    pointerEvents: inStock ? "auto" : "none",
    cursor: inStock ? "pointer" : "default",
  }),
);

const ImageBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "viewDirection",
})<{ viewDirection: ViewDirection }>(({ viewDirection, theme }) => ({
  position: "relative",
  backgroundColor: theme.palette.action.hover,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  ...(viewDirection === "column"
    ? { width: "100%", aspectRatio: "16/9" }
    : { width: theme.spacing(25), height: "100%" }),
}));

const StyledRestaurantMenu = styled(RestaurantMenu)(({ theme }) => ({
  fontSize: theme.spacing(6),
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  width: "100%",
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const wrapStyle: CSSObject = {
  overflowWrap: "anywhere",
};

const WrapTypography = styled(Typography)(wrapStyle);

const ClampTypography = styled(Typography)({
  ...wrapStyle,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const OriginalPriceTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isPromo",
})<{ isPromo: boolean }>(({ isPromo }) => ({
  ...(isPromo && {
    textDecoration: "line-through",
  }),
}));

interface ActionAreaCardProps {
  menuItem: OrderMenuItem;
}

const ActionAreaCard = ({ menuItem }: ActionAreaCardProps) => {
  const { name, description, image, offers } = menuItem;
  const offer = offers[0];
  const price = Number(offer.price);
  const priceCurrency = offer.priceCurrency;
  const stock = offer.inventoryLevel?.value;
  const stockUnit = offer.inventoryLevel?.unitText;
  const availability = offer.availability;

  const promoInfo = getActivePromo(offer);

  const { setDialog } = useDialogStore((state) => state);
  const { view } = useViewStore((state) => state);

  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const viewDirection = ViewDirections[view];

  const hasUnsatisfiableModifierGroup = menuItem.modifierGroups.some(
    ({ minSelectionCount, modifiers }) =>
      modifiers.filter(({ availability }) => availability !== "SoldOut")
        .length < minSelectionCount,
  );

  const isItemOutOfStock =
    stock === 0 || availability === "SoldOut" || hasUnsatisfiableModifierGroup;
  const showLowStock = isLowStock(offer);

  const handleDialogClick = () => {
    if (isItemOutOfStock) return;

    setDialog({
      cancelText: tDialog("close"),
      confirmText: tDialog("addToCart"),
      content: <CardDialogContent menuItem={menuItem} />,
      formId: "add-to-cart-form",
      open: true,
      title: name,
    });
  };

  return (
    <StyledCard variant="outlined">
      <ItemSoldOut isItemOutOfStock={isItemOutOfStock} />
      <StyledCardActionArea
        disableRipple={isItemOutOfStock}
        inStock={!isItemOutOfStock}
        onClick={handleDialogClick}
        viewDirection={viewDirection}
      >
        <ImageBox viewDirection={viewDirection}>
          {image ? (
            <Image
              alt={name}
              draggable={false}
              fill
              priority
              sizes="(min-width: 808px) 50vw, 100vw"
              src={image}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <StyledRestaurantMenu color="disabled" />
          )}
        </ImageBox>
        <StyledCardContent>
          <WrapTypography variant="subtitle1">{name}</WrapTypography>
          {description && (
            <ClampTypography color="text.secondary" variant="body2">
              {description}
            </ClampTypography>
          )}
          <Stack>
            <OriginalPriceTypography
              color={promoInfo ? "text.disabled" : "text.primary"}
              isPromo={!!promoInfo}
              variant={promoInfo ? "caption" : "subtitle2"}
            >
              {`${priceCurrency} ${price}`}
            </OriginalPriceTypography>
            {promoInfo && (
              <Typography color="error" variant="subtitle2">
                {`${priceCurrency} ${promoInfo.price}`}
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
        </StyledCardContent>
      </StyledCardActionArea>
    </StyledCard>
  );
};

export default ActionAreaCard;
