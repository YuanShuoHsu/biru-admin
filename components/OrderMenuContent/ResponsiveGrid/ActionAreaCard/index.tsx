import { useLocale, useTranslations } from "next-intl";
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
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

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

// const TopSoldChip = styled(Chip, {
//   shouldForwardProp: (prop) => prop !== "rank",
// })<{ rank: number }>(({ rank, theme }) => {
//   const backgroundColor =
//     rank === 0
//       ? "rgba(255, 215, 0, 0.5)"
//       : rank === 1
//         ? "rgba(192, 192, 192, 0.5)"
//         : rank === 2
//           ? "rgba(205, 133, 63, 0.5)"
//           : alpha(theme.palette.primary.main, 0.5);

//   return {
//     position: "absolute",
//     top: theme.spacing(1),
//     right: theme.spacing(1),
//     backgroundColor,
//     color: theme.palette.common.white,
//     fontWeight: theme.typography.fontWeightBold,
//     zIndex: 1,

//     "& .MuiChip-icon": {
//       color: theme.palette.common.white,
//     },
//   };
// });

// const LatestChip = styled(Chip)(({ theme }) => ({
//   position: "absolute",
//   top: theme.spacing(1),
//   right: theme.spacing(1),
//   backgroundColor: alpha(theme.palette.primary.main, 0.5),
//   color: theme.palette.common.white,
//   fontWeight: theme.typography.fontWeightBold,
//   zIndex: 1,

//   "& .MuiChip-icon": {
//     color: theme.palette.common.white,
//   },
// }));

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

const WrapTypography = styled(Typography)({
  overflowWrap: "anywhere",
});

// const SizeOptionChip = styled(Chip)({
//   "& .MuiChip-label": {
//     padding: 0,
//     width: 24,
//     display: "flex",
//     justifyContent: "center",
//   },
// });

const OriginalPriceTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isPromo",
})<{ isPromo: boolean }>(({ isPromo }) => ({
  ...(isPromo && {
    textDecoration: "line-through",
    lineHeight: 1.2,
  }),
}));

interface ActionAreaCardProps {
  menuItem: OrderMenuItem;
}

const ActionAreaCard = ({ menuItem }: ActionAreaCardProps) => {
  const { name, description, image, offers, suitableForDiet, nutrition } =
    menuItem;
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
  const locale = useLocale();

  const viewDirection = ViewDirections[view];

  // const sizes = options?.find(({ id }) => id === "size")?.choices;

  // const hasExtraCost = options?.some(({ choices }) =>
  //   choices.some(({ extraCost }) => extraCost > 0),
  // );

  const isItemOutOfStock = stock === 0 || availability === "SoldOut";
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
          {/* {topSoldRank !== undefined && (
            <TopSoldChip
              label={`${tOrder("mode.storeSlug.tableNumber.top")} ${topSoldRank + 1}`}
              icon={<FavoriteBorder />}
              rank={topSoldRank}
              size="small"
            />
          )}
          {showLatest && (
            <LatestChip
              label={tOrder("mode.storeSlug.tableNumber.new")}
              icon={<AutoAwesome />}
              size="small"
            />
          )} */}
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
          {/* <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"> */}
          {/* {sizes?.map(({ name }) => (
              <SizeOptionChip
                key={name[locale]}
                label={name[locale]}
                size="small"
              />
            ))} */}
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
          {/* </Stack> */}
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
        </StyledCardContent>
      </StyledCardActionArea>
    </StyledCard>
  );
};

export default ActionAreaCard;
