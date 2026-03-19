// vibe coding 未來要修正

"use client";

import { useLocale, useTranslations } from "next-intl";
import { startTransition, useEffect, useMemo, useState } from "react";

import { query } from "@/constants/query";
import { REMEMBER_ME } from "@/constants/sign-in";

import { useLogout } from "@/hooks/useLogout";

import {
  AccountCircle,
  CheckCircle,
  DeleteForever,
  ErrorOutline,
  Gavel,
  LockReset,
  Logout,
  MailOutline,
  Person,
  Policy,
  Security,
  Settings,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getDisplayName } from "@/utils/auth";
import { getHref } from "@/utils/href";

interface SettingRowProps {
  icon: React.ElementType;
  label: string;
  status?: React.ReactNode;
  value: string;
}

const SettingRow = ({ icon: Icon, label, status, value }: SettingRowProps) => (
  <Stack
    alignItems={{ xs: "flex-start", sm: "center" }}
    direction={{ xs: "column", sm: "row" }}
    gap={2}
  >
    <Box
      alignItems="center"
      bgcolor="action.hover"
      display="flex"
      height={44}
      justifyContent="center"
      sx={{ borderRadius: 2, aspectRatio: "1 / 1" }}
    >
      <Icon />
    </Box>
    <Stack flexGrow={1} gap={0.5} width="100%">
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Stack
        alignItems={{ xs: "flex-start", sm: "center" }}
        direction={{ xs: "column", sm: "row" }}
        gap={1}
        justifyContent="space-between"
        width="100%"
      >
        <Typography fontWeight={600} variant="body1">
          {value}
        </Typography>
        {status}
      </Stack>
    </Stack>
  </Stack>
);

interface AccountSettingsProps {
  currentURL: string;
}

const AccountSettings = ({ currentURL }: AccountSettingsProps) => {
  const [rememberMeByDefault, setRememberMeByDefault] = useState(true);

  const { session } = useAuthStore((state) => state);

  const locale = useLocale();

  const { handleLogout, isMutatingLogout } = useLogout();

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const stored = localStorage.getItem(REMEMBER_ME);
    const nextValue = stored === null ? true : stored === "true";

    if (stored === null) localStorage.setItem(REMEMBER_ME, "true");

    startTransition(() => {
      setRememberMeByDefault(nextValue);
    });
  }, []);

  const handleToggleRememberMe = () =>
    setRememberMeByDefault((prev) => {
      const next = !prev;
      localStorage.setItem(REMEMBER_ME, String(next));
      return next;
    });

  const formatDate = useMemo(
    () => (value?: Date | string | null) => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(date);
    },
    [locale],
  );

  const memberSince = formatDate(session?.user.createdAt);
  const updatedAt = formatDate(session?.user.updatedAt);

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: currentURL,
  });

  const verifyEmailHref = getHref("/auth/verify-email", {
    [query.email]: session?.user.email,
    [query.redirectTo]: currentURL,
  });

  const forgotPasswordHref = getHref("/auth/forgot-password", {
    [query.redirectTo]: currentURL,
  });

  const name = useMemo(
    () => getDisplayName(session?.user) || tAccount("profile.placeholderName"),
    [tAccount, session?.user],
  );

  const initial = name.charAt(0).toUpperCase();

  const verificationChip = (verified?: boolean) => (
    <Chip
      color={verified ? "success" : "warning"}
      icon={
        verified ? (
          <CheckCircle fontSize="small" />
        ) : (
          <ErrorOutline fontSize="small" />
        )
      }
      label={
        verified ? tAccount("profile.verified") : tAccount("profile.unverified")
      }
      size="small"
      variant={verified ? "filled" : "outlined"}
    />
  );

  if (!session?.user) {
    return (
      <Card>
        <CardHeader title={tAccount("accountSettings.title")} />
        <CardContent>
          <Stack gap={2}>
            <Typography variant="h6">
              {tAccount("accountSettings.signInCta")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {tAccount("accountSettings.empty")}
            </Typography>
            <Button
              href={signInHref}
              startIcon={<Settings />}
              variant="contained"
            >
              {tAuth("signIn.label")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const user = session?.user;

  return (
    <Stack gap={3}>
      <Card
        sx={(theme) => ({
          overflow: "hidden",
          position: "relative",
          border: `1px solid ${theme.vars.palette.divider}`,
        })}
      >
        <Box
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            background: `linear-gradient(120deg, rgba(${theme.vars.palette.primary.mainChannel} / 0.12), rgba(${theme.vars.palette.secondary.mainChannel ?? theme.vars.palette.primary.mainChannel} / 0.16))`,
            filter: "blur(12px)",
            transform: "scale(1.05)",
          })}
        />
        <CardContent sx={{ position: "relative" }}>
          <Stack
            alignItems="flex-start"
            direction={{ xs: "column", md: "row" }}
            gap={3}
            justifyContent="space-between"
          >
            <Stack alignItems="center" direction="row" gap={2}>
              <Avatar
                alt={name}
                src={user.image || undefined}
                sx={(theme) => ({
                  width: theme.spacing(7),
                  height: theme.spacing(7),
                  border: `2px solid ${theme.vars.palette.primary.main}`,
                  bgcolor: theme.vars.palette.background.paper,
                  color: theme.vars.palette.primary.main,
                })}
              >
                {initial}
              </Avatar>
              <Stack gap={0.5}>
                <Typography color="primary" fontWeight={700} variant="overline">
                  {tAccount("accountSettings.title")}
                </Typography>
                <Typography fontWeight={700} variant="h5">
                  {name}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {tAccount("accountSettings.subtitle")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {memberSince && (
                    <Chip
                      color="primary"
                      label={tAccount("profile.memberSince", {
                        date: memberSince,
                      })}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {updatedAt && (
                    <Chip
                      color="default"
                      label={tAccount("profile.lastUpdated", {
                        date: updatedAt,
                      })}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Stack>
            </Stack>
            <Stack
              alignItems="flex-end"
              gap={1}
              minWidth={{ xs: "100%", md: 260 }}
            >
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                justifyContent="flex-end"
              >
                {verificationChip(user.emailVerified)}
                {/* {verificationChip(user.phoneNumberVerified)} */}
              </Stack>
              {!user.emailVerified && (
                <Button
                  href={verifyEmailHref}
                  size="small"
                  startIcon={<Security />}
                  variant="outlined"
                >
                  {tAuth("verifyEmail.actions")}
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Grid columnSpacing={2} container rowSpacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack gap={2}>
            <Card>
              <CardHeader
                title={tAccount("accountSettings.sections.account")}
              />
              <CardContent>
                <Stack gap={2}>
                  <SettingRow
                    icon={Person}
                    label={tAccount("accountSettings.fields.name")}
                    value={name}
                  />
                  <Divider flexItem />
                  <SettingRow
                    icon={MailOutline}
                    label={tAuth("email.label")}
                    status={verificationChip(user.emailVerified)}
                    value={user.email || tCommon("empty")}
                  />
                  {/* <Divider flexItem />
                  <SettingRow
                    icon={PhoneIphone}
                    label={tAuth("phone")}
                    status={verificationChip(user.phoneNumberVerified)}
                    value={user.phoneNumber || tCommon("empty")}
                  /> */}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Button
                  href="/account/profile"
                  startIcon={<AccountCircle />}
                  variant="outlined"
                >
                  {tAccount("accountSettings.actions.viewProfile")}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title={tAccount("accountSettings.sections.security")}
              />
              <CardContent>
                <Stack gap={1.5}>
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
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack gap={2}>
            <Card>
              <CardHeader title={tAccount("accountSettings.sections.device")} />
              <CardContent>
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  gap={2}
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
                    slotProps={{
                      input: {
                        "aria-label": tAccount(
                          "accountSettings.rememberMe.label",
                        ),
                      },
                    }}
                    onChange={handleToggleRememberMe}
                    size="small"
                  />
                </Stack>
                <Typography color="text.secondary" mt={2} variant="caption">
                  {tAccount("accountSettings.deviceNotice")}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title={tAccount("accountSettings.sections.support")}
              />
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
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default AccountSettings;
