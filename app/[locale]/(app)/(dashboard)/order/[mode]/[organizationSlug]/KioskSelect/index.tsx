"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

import { DinnerDining, TakeoutDining } from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

const KioskSelect = () => {
  const { mode, organizationSlug } = useParams<{
    mode: string;
    organizationSlug: string;
  }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tOrder = useTranslations("order");

  const navigate = (type: "dine-in" | "takeout") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    router.push(`/order/${mode}/${organizationSlug}?${params.toString()}`);
  };

  return (
    <Stack alignItems="center" gap={4} py={4}>
      <Typography fontWeight="bold" variant="h5">
        {tOrder("mode.kiosk.title")}
      </Typography>
      <Stack direction="row" gap={3} width="100%">
        <Card sx={{ flex: 1 }} variant="outlined">
          <CardActionArea onClick={() => navigate("dine-in")} sx={{ py: 6 }}>
            <CardContent
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <DinnerDining sx={{ fontSize: 64 }} />
              <Typography fontWeight="bold" variant="h5">
                {tOrder("mode.kiosk.dineIn")}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{ flex: 1 }} variant="outlined">
          <CardActionArea onClick={() => navigate("takeout")} sx={{ py: 6 }}>
            <CardContent
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TakeoutDining sx={{ fontSize: 64 }} />
              <Typography fontWeight="bold" variant="h5">
                {tOrder("mode.kiosk.takeout")}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
    </Stack>
  );
};

export default KioskSelect;
