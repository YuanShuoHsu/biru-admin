"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

import { LocalMall, Restaurant } from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledCard = styled(Card)({
  flex: 1,
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  height: theme.spacing(32),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledRestaurant = styled(Restaurant)({
  fontSize: 64,
});

const StyledLocalMall = styled(LocalMall)({
  fontSize: 64,
});

const KioskSelect = () => {
  const { mode, organizationSlug } = useParams<{
    mode: string;
    organizationSlug: string;
  }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tOrder = useTranslations("order");

  const handleSelect = (type: "dine-in" | "takeout") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);

    router.push(`/order/${mode}/${organizationSlug}?${params.toString()}`);
  };

  return (
    <StyledContainer disableGutters maxWidth="sm">
      <Typography fontWeight="bold" variant="h6">
        {tOrder("mode.kiosk.title")}
      </Typography>
      <Stack width="100%" direction="row" gap={2}>
        <StyledCard variant="outlined">
          <CardActionArea onClick={() => handleSelect("dine-in")}>
            <StyledCardContent>
              <StyledRestaurant />
              <Typography fontWeight="bold" variant="h5">
                {tOrder("mode.kiosk.dineIn")}
              </Typography>
            </StyledCardContent>
          </CardActionArea>
        </StyledCard>
        <StyledCard variant="outlined">
          <CardActionArea onClick={() => handleSelect("takeout")}>
            <StyledCardContent>
              <StyledLocalMall />
              <Typography fontWeight="bold" variant="h5">
                {tOrder("mode.kiosk.takeout")}
              </Typography>
            </StyledCardContent>
          </CardActionArea>
        </StyledCard>
      </Stack>
    </StyledContainer>
  );
};

export default KioskSelect;
