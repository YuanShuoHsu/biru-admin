import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";

import CardDialogContent, {
  CardDialogContentImperativeHandle,
} from "./CardDialogContent";
import ItemSoldOut from "./ItemSoldOut";

import { ViewDirections } from "@/constants/view";

import { AutoAwesome, FavoriteBorder } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";
import { useViewStore } from "@/providers/view-store-provider";

import type { Option } from "@/types/menu";
import type { ViewDirection } from "@/types/view";

const StyledCard = styled(Card)({
  position: "relative",
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
})<{ viewDirection: ViewDirection }>(({ viewDirection }) => ({
  position: "relative",
  width: viewDirection === "column" ? "100%" : 140,
  height: viewDirection === "column" ? 140 : "100%",
}));

const TopSoldChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "rank",
})<{ rank: number }>(({ rank, theme }) => {
  const backgroundColor =
    rank === 0
      ? "rgba(255, 215, 0, 0.5)"
      : rank === 1
        ? "rgba(192, 192, 192, 0.5)"
        : rank === 2
          ? "rgba(205, 133, 63, 0.5)"
          : alpha(theme.palette.primary.main, 0.5);

  return {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    backgroundColor,
    color: theme.palette.common.white,
    fontWeight: theme.typography.fontWeightBold,
    zIndex: 1,

    "& .MuiChip-icon": {
      color: theme.palette.common.white,
    },
  };
});

const LatestChip = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: alpha(theme.palette.primary.main, 0.5),
  color: theme.palette.common.white,
  fontWeight: theme.typography.fontWeightBold,
  zIndex: 1,

  "& .MuiChip-icon": {
    color: theme.palette.common.white,
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  width: "100%",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

// const SizeOptionChip = styled(Chip)({
//   "& .MuiChip-label": {
//     padding: 0,
//     width: 24,
//     display: "flex",
//     justifyContent: "center",
//   },
// });

export interface ActionAreaCardProps {
  id: string;
  name: string;
  description: string;
  image: string | null;
  options: Option[];
  price: number;
  stock: number | null;
  showLatest: boolean;
  topSoldRank?: number;
}

const ActionAreaCard = ({
  id,
  name,
  description,
  image,
  options,
  price,
  stock,
  showLatest,
  topSoldRank,
}: ActionAreaCardProps) => {
  const dialogRef = useRef<CardDialogContentImperativeHandle>(null);

  const locale = useLocale();

  const { updateCartItem } = useCartStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);
  const { menus } = useMenuStore((state) => state);
  const { view } = useViewStore((state) => state);

  const tCommon = useTranslations("common");
  const tDialog = useTranslations("dialog");
  const tOrder = useTranslations("order");

  const viewDirection = ViewDirections[view];

  const displayPrice = price.toLocaleString(locale);

  // const sizes = options?.find(({ id }) => id === "size")?.choices;

  const hasExtraCost = options?.some(({ choices }) =>
    choices.some(({ extraCost }) => extraCost > 0),
  );

  const isItemOutOfStock = stock === 0;

  const handleDialogClick = () => {
    if (isItemOutOfStock) return;

    setDialog({
      cancelText: tDialog("close"),
      confirmText: tDialog("addToCart"),
      content: (
        <CardDialogContent
          id={id}
          name={name}
          description={description}
          image={image}
          menus={menus}
          options={options}
          price={price}
          stock={stock}
          ref={dialogRef}
        />
      ),
      onConfirm: async () => {
        if (!dialogRef.current) return;

        const { amount, extraCost, price, quantity, choices } =
          dialogRef.current.getValues();

        if (quantity <= 0) return;

        updateCartItem({
          id,
          amount,
          extraCost,
          image,
          price,
          quantity,
          choices,
        });
      },
      open: true,
      title: name,
    });
  };

  return (
    <StyledCard>
      <ItemSoldOut isItemOutOfStock={isItemOutOfStock} />
      <StyledCardActionArea
        disableRipple={isItemOutOfStock}
        inStock={!isItemOutOfStock}
        onClick={handleDialogClick}
        viewDirection={viewDirection}
      >
        <ImageBox viewDirection={viewDirection}>
          {topSoldRank !== undefined && (
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
          )}
          {image && (
            <Image
              alt={name}
              draggable={false}
              fill
              priority
              sizes="(min-width: 808px) 50vw, 100vw"
              src={image}
              style={{ objectFit: "cover" }}
            />
          )}
        </ImageBox>
        <StyledCardContent>
          <Typography variant="h6">{name}</Typography>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            {/* {sizes?.map(({ name }) => (
              <SizeOptionChip
                key={name[locale]}
                label={name[locale]}
                size="small"
              />
            ))} */}
            <Typography color="text.primary" variant="subtitle2">
              {`${tCommon("currency")} ${displayPrice} ${hasExtraCost ? tCommon("from") : ""}`}
            </Typography>
          </Stack>
          {description && (
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          )}
        </StyledCardContent>
      </StyledCardActionArea>
    </StyledCard>
  );
};

export default ActionAreaCard;
