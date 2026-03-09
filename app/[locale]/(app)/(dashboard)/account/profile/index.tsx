// vibe coding 未來要修正

// https://mui.com/material-ui/react-progress/#LinearDeterminate.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { query } from "@/constants/query";

import {
  CheckCircle,
  ErrorOutline,
  Login,
  MailOutline,
  Settings,
  Update,
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
  LinearProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getDisplayName } from "@/utils/auth";
import { getHref } from "@/utils/href";

type PreferenceKey = "newsletter" | "orderUpdates" | "recommendations";

const preferenceDefaults: Record<PreferenceKey, boolean> = {
  newsletter: true,
  orderUpdates: true,
  recommendations: false,
};

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

interface AccountProfileProps {
  currentURL: string;
}

const AccountProfile = ({ currentURL }: AccountProfileProps) => {
  const [preferences, setPreferences] = useState(preferenceDefaults);

  const { session } = useAuthStore((state) => state);

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: currentURL,
  });

  const locale = useLocale();

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const name = useMemo(
    () => getDisplayName(session?.user) || tAccount("profile.placeholderName"),
    [tAccount, session?.user],
  );

  const initial = name.charAt(0).toUpperCase();

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

  const memberSince = formatDate(session?.user?.createdAt);
  const updatedAt = formatDate(session?.user?.updatedAt);

  const completion = (() => {
    if (!session?.user) return 0;

    const points = [
      session.user.firstName,
      session.user.lastName,
      session.user.email,
      // session.user.phoneNumber,
      session.user.image,
      session.user.emailVerified,
      // session.user.phoneNumberVerified,
    ];

    const score = points.filter(Boolean).length;
    return Math.min(100, Math.round((score / points.length) * 100));
  })();

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

  const togglePreference = (key: PreferenceKey) =>
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderPreference = (
    key: PreferenceKey,
    label: string,
    helper?: string,
  ) => (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      gap={1}
      key={key}
    >
      <Stack minWidth={0}>
        <Typography fontWeight={600} variant="body2">
          {label}
        </Typography>
        {helper && (
          <Typography color="text.secondary" variant="caption">
            {helper}
          </Typography>
        )}
      </Stack>
      <Switch
        checked={preferences[key]}
        color="primary"
        slotProps={{ input: { "aria-label": label } }}
        onChange={() => togglePreference(key)}
        size="small"
      />
    </Stack>
  );

  if (!session?.user) {
    return (
      <Card>
        <CardHeader title={tAccount("accountMenu.profile")} />
        <CardContent>
          <Stack gap={2}>
            <Typography variant="h6">
              {tAccount("profile.signInCta")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {tAccount("profile.empty")}
            </Typography>
            <Button href={signInHref} startIcon={<Login />} variant="contained">
              {tAuth("signIn.label")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const user = session!.user;

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
                  {tAccount("accountMenu.profile")}
                </Typography>
                <Typography fontWeight={700} variant="h5">
                  {name}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {tAccount("profile.subtitle")}
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
                </Stack>
              </Stack>
            </Stack>
            <Stack gap={1} minWidth={{ xs: "100%", md: 280 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  {tAccount("profile.completion")}
                </Typography>
                <Typography fontWeight={700} variant="body2">
                  {completion}%
                </Typography>
              </Stack>
              <LinearProgress
                aria-label={tAccount("profile.completion")}
                value={completion}
                variant="determinate"
              />
              {updatedAt && (
                <Typography color="text.secondary" variant="caption">
                  {tAccount("profile.lastUpdated", {
                    date: updatedAt,
                  })}
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid columnSpacing={2} container rowSpacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack gap={2}>
            <Card>
              <CardHeader title={tAccount("profile.contact")} />
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
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={1}
                  justifyContent="flex-end"
                  mt={2}
                >
                  {verificationChip(user.emailVerified)}
                  {/* {verificationChip(user.phoneNumberVerified)} */}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Button
                  href="/account/account-settings"
                  startIcon={<Settings />}
                  variant="outlined"
                >
                  {tAccount("accountSettings.label")}
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack gap={2}>
            <Card>
              <CardHeader title={tAccount("profile.preferences")} />
              <CardContent>
                <Stack gap={1.5}>
                  {renderPreference(
                    "orderUpdates",
                    tAccount("profile.orderUpdates"),
                  )}
                  {renderPreference(
                    "newsletter",
                    tAccount("profile.newsletter"),
                  )}
                  {renderPreference(
                    "recommendations",
                    tAccount("profile.recommendations"),
                  )}
                </Stack>
                <Typography color="text.secondary" mt={2} variant="caption">
                  {tAccount("profile.localNotice")}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title={tAccount("profile.activity")} />
              <CardContent>
                <Stack gap={1.5}>
                  {memberSince && (
                    <Stack alignItems="center" direction="row" gap={1}>
                      <Update fontSize="small" />
                      <Typography variant="body2">
                        {tAccount("profile.memberSince", {
                          date: memberSince,
                        })}
                      </Typography>
                    </Stack>
                  )}
                  {updatedAt && (
                    <Stack alignItems="center" direction="row" gap={1}>
                      <CheckCircle color="primary" fontSize="small" />
                      <Typography variant="body2">
                        {tAccount("profile.lastUpdated", {
                          date: updatedAt,
                        })}
                      </Typography>
                    </Stack>
                  )}
                  {!memberSince && !updatedAt && (
                    <Typography color="text.secondary" variant="body2">
                      {tCommon("empty")}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default AccountProfile;
