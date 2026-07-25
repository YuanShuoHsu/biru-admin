"use client";

import { RestaurantMenu } from "@mui/icons-material";
import { Card, CardContent, CardMedia, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useMenuStore } from "@/providers/menu-store-provider";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",

  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.vars.palette.action.hover,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  aspectRatio: "16/9",
  flexShrink: 0,

  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(25),
    aspectRatio: "auto",
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const WrapTypography = styled(Typography)({
  overflowWrap: "anywhere",
});

const MenuCard = () => {
  const { menu } = useMenuStore((state) => state);

  return (
    <StyledCard variant="outlined">
      <StyledCardMedia image={menu?.image || undefined}>
        {!menu?.image && <RestaurantMenu color="disabled" fontSize="large" />}
      </StyledCardMedia>
      <StyledCardContent>
        <WrapTypography fontWeight="bold" variant="subtitle1">
          {menu?.name}
        </WrapTypography>
        {menu?.description && (
          <WrapTypography color="text.secondary" variant="body2">
            {menu.description}
          </WrapTypography>
        )}
      </StyledCardContent>
    </StyledCard>
  );
};

export default MenuCard;
