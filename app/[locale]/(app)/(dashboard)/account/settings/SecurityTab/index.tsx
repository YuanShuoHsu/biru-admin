"use client";

import { useTranslations } from "next-intl";
import { startTransition, useEffect, useState } from "react";

import { query } from "@/constants/query";
import { REMEMBER_ME } from "@/constants/sign-in";

import { useLogout } from "@/hooks/useLogout";

import {
  DeleteForever,
  Gavel,
  LockReset,
  Logout,
  Policy,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import { getHref } from "@/utils/href";

interface SecurityTabProps {
  currentURL: string;
}

const SecurityTab = ({ currentURL }: SecurityTabProps) => {
  const [rememberMeByDefault, setRememberMeByDefault] = useState(true);

  const { handleLogout, isMutatingLogout } = useLogout();

  const tAccount = useTranslations("account");
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

  const forgotPasswordHref = getHref("/auth/forgot-password", {
    [query.redirectTo]: currentURL,
  });

  return (
    <>
      <Card>
        <CardHeader title={tAccount("accountSettings.sections.security")} />
        <CardContent>
          <Stack gap={1.5}>
            <Stack
              alignItems="center"
              direction="row"
              gap={2}
              justifyContent="space-between"
            >
              <Stack minWidth={0}>
                <Typography fontWeight={600} variant="body2">
                  {tAccount("accountSettings.rememberMe.label")}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {tAccount("accountSettings.rememberMe.helper")}
                </Typography>
              </Stack>
              <Switch
                checked={rememberMeByDefault}
                color="primary"
                onChange={handleToggleRememberMe}
                size="small"
                slotProps={{
                  input: {
                    "aria-label": tAccount("accountSettings.rememberMe.label"),
                  },
                }}
              />
            </Stack>
            <Divider />
            <Button
              href={forgotPasswordHref}
              startIcon={<LockReset />}
              variant="outlined"
            >
              {tAuth("forgotPassword.label")}
            </Button>
            <Button
              color="error"
              loading={isMutatingLogout}
              loadingPosition="end"
              onClick={handleLogout}
              startIcon={<Logout />}
              variant="contained"
            >
              {tAuth("signOut.label")}
            </Button>
          </Stack>
          <Typography color="text.secondary" mt={2} variant="caption">
            {tAccount("accountSettings.securityNotice")}
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={tAccount("accountSettings.sections.support")} />
        <CardContent>
          <Stack gap={1.5}>
            <Button
              href="/company/terms"
              startIcon={<Gavel />}
              variant="outlined"
            >
              {tAccount("accountSettings.actions.terms")}
            </Button>
            <Button
              href="/company/privacy"
              startIcon={<Policy />}
              variant="outlined"
            >
              {tAccount("accountSettings.actions.privacy")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={tAccount("accountSettings.sections.danger")} />
        <CardContent>
          <Stack gap={1}>
            <Typography fontWeight={600} variant="body2">
              {tAccount("accountSettings.danger.title")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {tAccount("accountSettings.danger.subtitle")}
            </Typography>
            <Button
              color="error"
              disabled
              startIcon={<DeleteForever />}
              variant="outlined"
            >
              {tAccount("accountSettings.danger.action")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};

export default SecurityTab;
