"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
import { z } from "zod";

import { query } from "@/constants/query";
import { REMEMBER_ME } from "@/constants/sign-in";

import { useLogout } from "@/hooks/useLogout";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  DeleteForever,
  Gavel,
  Key,
  Lock,
  LockReset,
  Logout,
  Menu as MenuIcon,
  MoreHoriz,
  Person,
  Policy,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useSnackbar } from "notistack";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getDisplayName } from "@/utils/auth";
import { getHref } from "@/utils/href";

type Tab = "account" | "security" | "apiKeys";

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

const nameSchema = z.object({ name: z.string().min(1).max(32) });
const emailSchema = z.object({ email: z.string().email() });

interface AccountSettingsProps {
  currentURL: string;
}

const cardFooterSx = {
  borderTop: 1,
  borderColor: "divider",
  px: 3,
  py: 2,
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "transparent" : "action.hover",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
} as const;

const AccountSettings = ({ currentURL }: AccountSettingsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [accountMenuState, setAccountMenuState] = useState<{
    el: HTMLElement;
    token: string;
    email: string;
  } | null>(null);
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [switchingToken, setSwitchingToken] = useState<string | null>(null);
  const [rememberMeByDefault, setRememberMeByDefault] = useState(true);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { session } = useAuthStore((state) => state);

  const locale = useLocale();

  const { handleLogout, isMutatingLogout } = useLogout({
    onSuccess: () => router.push("/auth/sign-in"),
  });

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");

  const nameForm = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const { data: deviceSessions = [], mutate: mutateDeviceSessions } = useSWR<
    DeviceSession[]
  >(session ? "device-sessions" : null, async () => {
    const { data } = await authClient.multiSession.listDeviceSessions();
    return data || [];
  });

  const otherSessions = deviceSessions.filter(
    ({ session: { token } }) => token !== session?.session.token,
  );

  useEffect(() => {
    if (!session?.user) return;
    const displayName = getDisplayName(session.user) || "";
    nameForm.reset({ name: displayName });
  }, [session?.user?.name, session?.user?.firstName, session?.user?.lastName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session?.user?.email) return;
    emailForm.reset({ email: session.user.email });
  }, [session?.user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarMenuAnchor(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await authClient.updateUser({
        image: base64,
        fetchOptions: {
          onError: ({ error }) => {
            enqueueSnackbar(getErrorMessage(error.code, locale), {
              variant: "error",
            });
          },
          onSuccess: () => {
            enqueueSnackbar(tAccount("accountSettings.avatar.saveSuccess"), {
              variant: "success",
            });
          },
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onNameSubmit = async (values: { name: string }) => {
    setIsSavingName(true);
    await authClient.updateUser({
      name: values.name,
      fetchOptions: {
        onError: ({ error }) => {
          setIsSavingName(false);
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: () => {
          setIsSavingName(false);
          enqueueSnackbar(tAccount("accountSettings.name.saveSuccess"), {
            variant: "success",
          });
        },
      },
    });
  };

  const onEmailSubmit = async (values: { email: string }) => {
    setIsSavingEmail(true);
    await authClient.changeEmail({
      newEmail: values.email,
      fetchOptions: {
        onError: ({ error }) => {
          setIsSavingEmail(false);
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: () => {
          setIsSavingEmail(false);
          enqueueSnackbar(tAccount("accountSettings.email.saveSuccess"), {
            variant: "success",
          });
        },
      },
    });
  };

  const handleRevokeSession = async () => {
    if (!accountMenuState) return;
    const { token, email } = accountMenuState;
    setAccountMenuState(null);
    setRevokingToken(token);

    await authClient.multiSession.revoke({
      sessionToken: token,
      fetchOptions: {
        onError: ({ error }) => {
          setRevokingToken(null);
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          await mutateDeviceSessions();
          setRevokingToken(null);
          enqueueSnackbar(
            tAccount("accountSettings.sessions.revokeSuccess", { email }),
            { variant: "success" },
          );
        },
      },
    });
  };

  const handleSwitchSession = async () => {
    if (!accountMenuState) return;
    const { token, email } = accountMenuState;
    setAccountMenuState(null);
    setSwitchingToken(token);

    await authClient.multiSession.setActive({
      sessionToken: token,
      fetchOptions: {
        onError: ({ error }) => {
          setSwitchingToken(null);
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: () => {
          enqueueSnackbar(tAccount("switchSession.success", { email }), {
            variant: "success",
          });
          window.location.reload();
        },
      },
    });
  };

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: currentURL,
  });
  const forgotPasswordHref = getHref("/auth/forgot-password", {
    [query.redirectTo]: currentURL,
  });
  const addAccountHref = getHref("/auth/sign-in", {
    [query.redirectTo]: currentURL,
  });

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
              startIcon={<Person />}
              variant="contained"
            >
              {tAuth("signIn.label")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const user = session.user;
  const displayName =
    getDisplayName(user) || tAccount("profile.placeholderName");
  const initial = displayName.charAt(0).toUpperCase();

  const navItems = [
    {
      id: "account" as Tab,
      Icon: Person,
      label: tAccount("accountSettings.sections.account"),
    },
    {
      id: "security" as Tab,
      Icon: Lock,
      label: tAccount("accountSettings.sections.security"),
    },
    {
      id: "apiKeys" as Tab,
      Icon: Key,
      label: tAccount("accountSettings.sections.apiKeys"),
    },
  ];

  const activeNavItem = navItems.find((n) => n.id === activeTab)!;

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, md: 6 },
        width: "100%",
      }}
    >
      {/* Hidden file input */}
      <input
        ref={avatarInputRef}
        accept="image/*"
        hidden
        type="file"
        onChange={handleAvatarChange}
      />

      {/* Mobile nav dropdown trigger */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Button
          fullWidth
          variant="contained"
          onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
          sx={{ justifyContent: "flex-start", gap: 1 }}
        >
          <activeNavItem.Icon fontSize="small" />
          <Box component="span" sx={{ flexGrow: 1, textAlign: "left" }}>
            {activeNavItem.label}
          </Box>
          <MenuIcon fontSize="small" />
        </Button>
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={() => setMobileMenuAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 200 } } }}
        >
          {navItems.map(({ id, Icon, label }) => (
            <MenuItem
              key={id}
              selected={activeTab === id}
              onClick={() => {
                setActiveTab(id);
                setMobileMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Desktop sidebar */}
      <Box
        sx={{ display: { xs: "none", md: "block" }, width: 256, flexShrink: 0 }}
      >
        <Stack gap={0.5}>
          {navItems.map(({ id, Icon, label }) => (
            <Button
              key={id}
              fullWidth
              startIcon={<Icon />}
              variant={activeTab === id ? "contained" : "text"}
              onClick={() => setActiveTab(id)}
              sx={{ justifyContent: "flex-start" }}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Content area */}
      <Stack sx={{ flex: 1, minWidth: 0 }} gap={2}>
        {/* Account tab */}
        {activeTab === "account" && (
          <>
            {/* Avatar card */}
            <Card sx={{ pb: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <CardHeader
                  subheader={tAccount("accountSettings.avatar.description")}
                  title={tAccount("accountSettings.avatar.title")}
                  sx={{ flexGrow: 1 }}
                />
                <ButtonBase
                  onClick={(e) =>
                    setAvatarMenuAnchor(e.currentTarget as HTMLElement)
                  }
                  sx={{ borderRadius: "50%", m: 2, flexShrink: 0 }}
                >
                  <Avatar
                    alt={displayName}
                    src={user.image || undefined}
                    sx={{ width: 80, height: 80, fontSize: "2rem" }}
                  >
                    {initial}
                  </Avatar>
                </ButtonBase>
              </Box>
              <Box sx={{ ...cardFooterSx, py: 2.5 }}>
                <Typography color="text.secondary" variant="caption">
                  {tAccount("accountSettings.avatar.notice")}
                </Typography>
              </Box>
              <Menu
                anchorEl={avatarMenuAnchor}
                open={Boolean(avatarMenuAnchor)}
                onClose={() => setAvatarMenuAnchor(null)}
              >
                <MenuItem onClick={() => avatarInputRef.current?.click()}>
                  {tAccount("accountSettings.avatar.upload")}
                </MenuItem>
              </Menu>
            </Card>

            {/* Name form card */}
            <form onSubmit={nameForm.handleSubmit(onNameSubmit)}>
              <Card sx={{ pb: 0 }}>
                <CardHeader
                  subheader={tAccount("accountSettings.name.description")}
                  title={tAccount("accountSettings.fields.name")}
                />
                <CardContent>
                  <Controller
                    control={nameForm.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        error={!!fieldState.error}
                        fullWidth
                        placeholder={tAccount("accountSettings.fields.name")}
                        size="small"
                      />
                    )}
                  />
                </CardContent>
                <Box sx={cardFooterSx}>
                  <Typography color="text.secondary" variant="caption">
                    {tAccount("accountSettings.name.notice")}
                  </Typography>
                  <Button
                    loading={isSavingName}
                    size="small"
                    type="submit"
                    variant="contained"
                  >
                    {tAccount("accountSettings.save")}
                  </Button>
                </Box>
              </Card>
            </form>

            {/* Email form card */}
            <form noValidate onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <Card sx={{ pb: 0 }}>
                <CardHeader
                  subheader={tAccount("accountSettings.email.description")}
                  title={tAuth("email.label")}
                />
                <CardContent>
                  <Controller
                    control={emailForm.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        error={!!fieldState.error}
                        fullWidth
                        placeholder="m@example.com"
                        size="small"
                        type="email"
                      />
                    )}
                  />
                </CardContent>
                <Box sx={cardFooterSx}>
                  <Typography color="text.secondary" variant="caption">
                    {tAccount("accountSettings.email.notice")}
                  </Typography>
                  <Button
                    loading={isSavingEmail}
                    size="small"
                    type="submit"
                    variant="contained"
                  >
                    {tAccount("accountSettings.save")}
                  </Button>
                </Box>
              </Card>
            </form>

            {/* Accounts card */}
            <Card sx={{ pb: 0 }}>
              <CardHeader
                subheader={tAccount("accountSettings.accounts.description")}
                title={tAccount("accountSettings.accounts.title")}
              />
              <CardContent>
                <Stack gap={2}>
                  {otherSessions.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      {tAccount("accountSettings.sessions.empty")}
                    </Typography>
                  ) : (
                    otherSessions.map(
                      ({ session: { token }, user: sessionUser }) => {
                        const sessionName =
                          getDisplayName(sessionUser) || sessionUser.email;
                        const isLoading =
                          revokingToken === token || switchingToken === token;

                        return (
                          <Card
                            key={token}
                            variant="outlined"
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              p: 2,
                              gap: 1,
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              gap={1}
                              sx={{ flex: 1, minWidth: 0 }}
                            >
                              <Avatar
                                alt={sessionName}
                                src={sessionUser.image || undefined}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: 14,
                                  flexShrink: 0,
                                }}
                              >
                                {sessionName.charAt(0)}
                              </Avatar>
                              <Stack sx={{ minWidth: 0 }}>
                                <Typography
                                  fontWeight={500}
                                  noWrap
                                  variant="body2"
                                >
                                  {sessionName}
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  noWrap
                                  variant="caption"
                                >
                                  {sessionUser.email}
                                </Typography>
                              </Stack>
                            </Stack>
                            <IconButton
                              disabled={isLoading}
                              onClick={(e) =>
                                setAccountMenuState({
                                  el: e.currentTarget,
                                  token,
                                  email: sessionUser.email,
                                })
                              }
                              size="small"
                              sx={{ flexShrink: 0, ml: "auto" }}
                            >
                              <MoreHoriz />
                            </IconButton>
                          </Card>
                        );
                      },
                    )
                  )}
                </Stack>
              </CardContent>
              <Box sx={cardFooterSx}>
                <Typography color="text.secondary" variant="caption">
                  {tAccount("accountSettings.accounts.notice")}
                </Typography>
                <Button href={addAccountHref} size="small" variant="contained">
                  {tAccount("accountMenu.addAnotherAccount")}
                </Button>
              </Box>
            </Card>

            {/* Account ellipsis menu */}
            <Menu
              anchorEl={accountMenuState?.el}
              open={Boolean(accountMenuState)}
              onClose={() => setAccountMenuState(null)}
            >
              <MenuItem onClick={handleSwitchSession}>
                {tAccount("switchSession.switchTo")}
              </MenuItem>
              <MenuItem
                onClick={handleRevokeSession}
                sx={{ color: "error.main" }}
              >
                {tAccount("accountSettings.sessions.revoke")}
              </MenuItem>
            </Menu>
          </>
        )}

        {/* Security tab */}
        {activeTab === "security" && (
          <Stack gap={2}>
            <Card>
              <CardHeader
                title={tAccount("accountSettings.sections.security")}
              />
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
                          "aria-label": tAccount(
                            "accountSettings.rememberMe.label",
                          ),
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
        )}

        {/* API Keys tab */}
        {activeTab === "apiKeys" && (
          <Card>
            <CardHeader title={tAccount("accountSettings.sections.apiKeys")} />
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {tAccount("accountSettings.apiKeys.comingSoon")}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
};

export default AccountSettings;
