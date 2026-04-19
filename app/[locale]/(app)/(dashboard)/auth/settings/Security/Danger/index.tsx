"use client";

import { useTranslations } from "next-intl";

import { StyledCardHeader } from "@/components/FormCard";

import { DeleteForever } from "@mui/icons-material";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";

const AuthSettingsSecurityDanger = () => {
  const tAuth = useTranslations("auth");

  return (
    <Card sx={{ borderColor: "error.main" }} variant="outlined">
      <StyledCardHeader
        title={
          <Typography color="error" fontWeight="bold" variant="h6">
            {tAuth("settings.danger.label")}
          </Typography>
        }
      />
      <CardContent>
        <Stack
          alignItems={{ sm: "center" }}
          direction={{ xs: "column", sm: "row" }}
          gap={2}
          justifyContent="space-between"
        >
          <Stack>
            <Typography fontWeight={500} variant="body2">
              {tAuth("settings.danger.title")}
            </Typography>
            <Typography color="text.secondary" mt={0.5} variant="caption">
              {tAuth("settings.danger.subtitle")}
            </Typography>
          </Stack>
          <Button
            color="error"
            disabled
            size="small"
            startIcon={<DeleteForever />}
            sx={{ flexShrink: 0 }}
            variant="contained"
          >
            {tAuth("settings.danger.action")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AuthSettingsSecurityDanger;
