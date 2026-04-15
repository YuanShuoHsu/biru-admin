"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
import { z } from "zod";

import { query } from "@/constants/query";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { MoreHoriz } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getDisplayName } from "@/utils/auth";
import { getHref } from "@/utils/href";

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

const nameSchema = z.object({ name: z.string().min(1).max(32) });
const emailSchema = z.object({ email: z.string().email() });

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

interface AccountTabProps {
  currentURL: string;
}

const AccountTab = ({ currentURL }: AccountTabProps) => {
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

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { session } = useAuthStore((state) => state);

  const locale = useLocale();

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

  if (!session?.user) return null;

  const user = session.user;
  const displayName =
    getDisplayName(user) || tAccount("profile.placeholderName");
  const initial = displayName.charAt(0).toUpperCase();

  const addAccountHref = getHref("/auth/sign-in", {
    [query.redirectTo]: currentURL,
  });

  return (
    <>
      <input
        ref={avatarInputRef}
        accept="image/*"
        hidden
        type="file"
        onChange={handleAvatarChange}
      />
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
            onClick={(e) => setAvatarMenuAnchor(e.currentTarget as HTMLElement)}
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
              otherSessions.map(({ session: { token }, user: sessionUser }) => {
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
                        <Typography fontWeight={500} noWrap variant="body2">
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
              })
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
      <Menu
        anchorEl={accountMenuState?.el}
        open={Boolean(accountMenuState)}
        onClose={() => setAccountMenuState(null)}
      >
        <MenuItem onClick={handleSwitchSession}>
          {tAccount("switchSession.switchTo")}
        </MenuItem>
        <MenuItem onClick={handleRevokeSession} sx={{ color: "error.main" }}>
          {tAccount("accountSettings.sessions.revoke")}
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountTab;
