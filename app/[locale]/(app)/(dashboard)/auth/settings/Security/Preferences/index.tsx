"use client";

import { useTranslations } from "next-intl";
import { startTransition, useEffect, useState } from "react";

import { StyledCardHeader } from "@/components/FormCard";

import { REMEMBER_ME } from "@/constants/sign-in";

import { Card, CardContent, Stack, Switch, Typography } from "@mui/material";

const AuthSettingsSecurityPreferences = () => {
  const [rememberMeByDefault, setRememberMeByDefault] = useState(true);

  const tAuth = useTranslations("auth");

  useEffect(() => {
    const stored = localStorage.getItem(REMEMBER_ME);
    const nextValue = stored === null ? true : stored === "true";
    if (stored === null) localStorage.setItem(REMEMBER_ME, "true");
    startTransition(() => setRememberMeByDefault(nextValue));
  }, []);

  const handleToggleRememberMe = () =>
    setRememberMeByDefault((prev) => {
      const next = !prev;
      localStorage.setItem(REMEMBER_ME, String(next));
      return next;
    });

  return (
    <Card>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.preferences.label")}
          </Typography>
        }
      />
      <CardContent>
        <Stack
          alignItems="center"
          direction="row"
          gap={2}
          justifyContent="space-between"
        >
          <Stack minWidth={0}>
            <Typography fontWeight={500} variant="body2">
              {tAuth("settings.rememberMe.label")}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {tAuth("settings.rememberMe.helper")}
            </Typography>
          </Stack>
          <Switch
            checked={rememberMeByDefault}
            color="primary"
            onChange={handleToggleRememberMe}
            size="small"
            slotProps={{
              input: {
                "aria-label": tAuth("settings.rememberMe.label"),
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AuthSettingsSecurityPreferences;
