// vibe coding 未來要修正

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { query } from "@/constants/query";

import { useLogout } from "@/hooks/useLogout";

import {
  CheckCircle,
  ErrorOutline,
  Gavel,
  LockReset,
  Login,
  Logout,
  MailOutline,
  Person,
  Policy,
  Security,
  Settings,
  Style,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getDisplayName } from "@/utils/auth";
import { getHref } from "@/utils/href";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  status?: React.ReactNode;
  value: string;
}

const InfoRow = ({ icon: Icon, label, status, value }: InfoRowProps) => (
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

interface MyAccountProps {
  currentURL: string;
}

const MyAccount = ({ currentURL }: MyAccountProps) => {
  const { session } = useAuthStore((state) => state);

  const { handleLogout, isMutatingLogout } = useLogout();

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

  const locale = useLocale();

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tAppBar = useTranslations("appBar");

  const { mode, setMode } = useColorScheme();
  const isModeLoading = !mode;
  const isDarkMode = mode === "dark";

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
        <CardHeader title={tAccount("myAccount.title")} />
        <CardContent>
          <Stack gap={2}>
            <Typography variant="h6">
              {tAccount("myAccount.signInCta")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {tAccount("myAccount.empty")}
            </Typography>
            <Button href={signInHref} startIcon={<Login />} variant="contained">
              {tAuth("signIn.label")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const user = session.user;

  const memberSince = formatDate(user.createdAt);
  const updatedAt = formatDate(user.updatedAt);

  const name = getDisplayName(user) || tAccount("profile.placeholderName");
  const initial = name.charAt(0).toUpperCase();

  const settingsHref = "/account/account-settings";
  const profileHref = "/account/profile";

  const handleToggleColorMode = () => {
    if (isModeLoading) return;
    setMode(isDarkMode ? "light" : "dark");
  };

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
                  {tAccount("myAccount.title")}
                </Typography>
                <Typography fontWeight={700} variant="h5">
                  {name}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {tAccount("myAccount.subtitle")}
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
              minWidth={{ xs: "100%", md: 320 }}
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
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                justifyContent="flex-end"
              >
                <Button
                  href={settingsHref}
                  size="small"
                  startIcon={<Settings />}
                  variant="contained"
                >
                  {tAccount("accountSettings.label")}
                </Button>
                <Button
                  href={profileHref}
                  size="small"
                  startIcon={<Person />}
                  variant="outlined"
                >
                  {tAccount("accountMenu.profile")}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid columnSpacing={2} container rowSpacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack gap={2}>
            <Card>
              <CardHeader title={tAccount("myAccount.sections.overview")} />
              <CardContent>
                <Stack gap={2}>
                  <InfoRow
                    icon={MailOutline}
                    label={tAuth("email.label")}
                    status={verificationChip(user.emailVerified)}
                    value={user.email || tCommon("empty")}
                  />
                  {/* <Divider flexItem />
                  <InfoRow
                    icon={PhoneIphone}
                    label={tAuth("phone")}
                    status={verificationChip(user.phoneNumberVerified)}
                    value={user.phoneNumber || tCommon("empty")}
                  /> */}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={tAccount("myAccount.sections.security")} />
              <CardContent>
                <Stack gap={1.5}>
                  {!user.emailVerified && (
                    <Button
                      href={verifyEmailHref}
                      startIcon={<Security />}
                      variant="outlined"
                    >
                      {tAccount("myAccount.actions.verifyEmail")}
                    </Button>
                  )}
                  <Button
                    href={forgotPasswordHref}
                    startIcon={<LockReset />}
                    variant="outlined"
                  >
                    {tAccount("myAccount.actions.resetPassword")}
                  </Button>
                  <Button
                    color="error"
                    loading={isMutatingLogout}
                    onClick={handleLogout}
                    startIcon={<Logout />}
                    variant="contained"
                  >
                    {tAuth("signOut.label")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack gap={2}>
            <Card>
              <CardHeader title={tAccount("myAccount.sections.quickActions")} />
              <CardContent>
                <Stack gap={1.5}>
                  <Button
                    href={profileHref}
                    startIcon={<Person />}
                    variant="outlined"
                  >
                    {tAccount("myAccount.actions.profile")}
                  </Button>
                  <Button
                    href={settingsHref}
                    startIcon={<Settings />}
                    variant="outlined"
                  >
                    {tAccount("myAccount.actions.settings")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={tAccount("myAccount.sections.appearance")} />
              <CardContent>
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  gap={2}
                >
                  <Stack minWidth={0}>
                    <Typography fontWeight={600} variant="body2">
                      {tAccount("myAccount.colorMode.label")}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {tAccount("myAccount.colorMode.helper")}
                    </Typography>
                  </Stack>
                  <Stack alignItems="center" direction="row" gap={1}>
                    <Style fontSize="small" />
                    <Switch
                      checked={isDarkMode}
                      color="primary"
                      disabled={isModeLoading}
                      slotProps={{
                        input: {
                          "aria-label": tAccount("myAccount.colorMode.label"),
                        },
                      }}
                      onChange={handleToggleColorMode}
                      size="small"
                    />
                  </Stack>
                </Stack>
                <Typography color="text.secondary" mt={1} variant="caption">
                  {isModeLoading
                    ? tCommon("loading")
                    : isDarkMode
                      ? tAppBar("darkMode")
                      : tAppBar("lightMode")}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={tAccount("myAccount.sections.support")} />
              <CardContent>
                <Stack gap={1.5}>
                  <Button
                    href="/company/terms"
                    startIcon={<Gavel />}
                    variant="outlined"
                  >
                    {tAccount("myAccount.actions.terms")}
                  </Button>
                  <Button
                    href="/company/privacy"
                    startIcon={<Policy />}
                    variant="outlined"
                  >
                    {tAccount("myAccount.actions.privacy")}
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

export default MyAccount;
