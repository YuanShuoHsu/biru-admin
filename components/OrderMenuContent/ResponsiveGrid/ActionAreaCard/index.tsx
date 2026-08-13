import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";

import ItemSoldOut from "./ItemSoldOut";

import CardDialogContent from "@/components/CardDialogContent";

import { API_ORDER_MODE } from "@/constants/orderMode";
import { ViewDirections, ViewImageSizes } from "@/constants/view";

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
import type { RouteParams } from "@/types/routeParams";
import type { ViewDirection } from "@/types/view";

import {
  getActivePromo,
  hasUnsatisfiableModifierGroup,
  isLowStock,
} from "@/utils/menus";

const StyledCard = styled(Card)({
  position: "relative",
  width: "100%",
  height: "100%",
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
  ...wrapStyle,
  ...(isPromo && {
    textDecoration: "line-through",
  }),
}));

interface ActionAreaCardProps {
  menuItem: OrderMenuItem;
  priority: boolean;
}

const ActionAreaCard = ({ menuItem, priority }: ActionAreaCardProps) => {
  const { availableModes, name, description, image, offers } = menuItem;
  const offer = offers[0];
  const price = Number(offer.price);
  const priceCurrency = offer.priceCurrency;
  const stock = offer.inventoryLevel?.value;
  const stockUnit = offer.inventoryLevel?.unitText;
  const availability = offer.availability;

  const promoInfo = getActivePromo(offer);

  const { mode } = useParams<RouteParams<"mode">>();
  const apiMode = API_ORDER_MODE[mode];

  const { setDialog } = useDialogStore((state) => state);
  const { view } = useViewStore((state) => state);

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const viewDirection = ViewDirections[view];

  const isModeUnavailable = !availableModes.includes(apiMode);
  const isItemOutOfStock =
    isModeUnavailable ||
    stock === 0 ||
    availability === "SoldOut" ||
    availability === "Discontinued" ||
    hasUnsatisfiableModifierGroup(menuItem.modifierGroups, apiMode);
  const showLowStock = !isItemOutOfStock && isLowStock(offer);

  const soldOutLabel =
    availability === "Discontinued"
      ? tCommon("discontinued")
      : isModeUnavailable
        ? tOrder(`mode.${apiMode}.unavailable`)
        : isItemOutOfStock
          ? tCommon("soldOut")
          : "";

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
      <ItemSoldOut soldOutLabel={soldOutLabel} />
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
              priority={priority}
              sizes={ViewImageSizes[view]}
              src={image}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <StyledRestaurantMenu color="disabled" />
          )}
        </ImageBox>
        <StyledCardContent>
          <WrapTypography fontWeight="bold" variant="subtitle1">
            {name}
          </WrapTypography>
          {description && (
            <ClampTypography color="text.secondary" variant="body2">
              {description}
            </ClampTypography>
          )}
          <Stack>
            <OriginalPriceTypography
              color={promoInfo ? "text.disabled" : "primary"}
              fontWeight="bold"
              isPromo={!!promoInfo}
              variant={promoInfo ? "caption" : "subtitle2"}
            >
              {`${priceCurrency} ${price}`}
            </OriginalPriceTypography>
            {promoInfo && (
              <WrapTypography
                color="error"
                fontWeight="bold"
                variant="subtitle2"
              >
                {`${priceCurrency} ${promoInfo.price}`}
              </WrapTypography>
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
