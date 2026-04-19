"use client";

import { useTranslations } from "next-intl";

import { StyledCardHeader } from "@/components/FormCard";

import { Gavel, Policy } from "@mui/icons-material";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";

const AuthSettingsSecuritySupport = () => {
  const tAuth = useTranslations("auth");

  return (
    <Card>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.support.label")}
          </Typography>
        }
      />
      <CardContent>
        <Stack gap={1.5}>
          <Button
            href="/company/terms"
            startIcon={<Gavel />}
            variant="outlined"
          >
            {tAuth("settings.actions.terms")}
          </Button>
          <Button
            href="/company/privacy"
            startIcon={<Policy />}
            variant="outlined"
          >
            {tAuth("settings.actions.privacy")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AuthSettingsSecuritySupport;
