"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Fragment, useState } from "react";
import useSWR from "swr";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import { useLogout } from "@/hooks/useLogout";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Logout, MoreHoriz } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  listItemIconClasses,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getDisplayName } from "@/utils/auth";

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

type SessionMenuState = {
  anchorEl: HTMLElement;
  token: string;
  email: string;
};

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiDivider-root": {
    marginBlock: theme.spacing(1),
  },
}));

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  backgroundImage: "var(--Paper-overlay)",
  display: "flex",
  alignItems: "center",

  [`& .${listItemIconClasses.root}`]: {
    minWidth: theme.spacing(4.5),
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 24,
  height: 24,
  backgroundColor: theme.vars.palette.background.paper,
  border: `1px solid ${theme.vars.palette.primary.main}`,
  color: theme.vars.palette.primary.main,
  fontSize: 12,

  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.common.white,
    borderColor: theme.vars.palette.common.white,
    color: theme.vars.palette.primary.contrastText,
  },
}));

const AuthSettingsAccountSessions = () => {
  const [accountMenuState, setAuthMenuState] =
    useState<SessionMenuState | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const { session, setSession } = useAuthStore((state) => state);

  const locale = useLocale();

  const { handleLogout, isMutatingLogout } = useLogout();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const { data: deviceSessions = [], mutate: mutateDeviceSessions } = useSWR<
    DeviceSession[]
  >(session ? "device-sessions" : null, async () => {
    const { data } = await authClient.multiSession.listDeviceSessions();

    return data || [];
  });

  const otherSessions = deviceSessions.filter(
    ({ session: { token } }) => token !== session?.session.token,
  );

  const closeAccountMenu = () => setAuthMenuState(null);

  const onOpenAccountMenu = (
    anchorEl: HTMLElement,
    token: string,
    email: string,
  ) => setAuthMenuState({ anchorEl, token, email });

  const onRevokeSession = async () => {
    if (!accountMenuState) return;

    const { token, email } = accountMenuState;
    closeAccountMenu();
    setPendingToken(token);

    await authClient.multiSession.revoke({
      sessionToken: token,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          setPendingToken(null);
          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          await mutateDeviceSessions();
          setPendingToken(null);
          enqueueSnackbar(tAuth("settings.sessions.revokeSuccess", { email }), {
            variant: "success",
          });
        },
      },
    });
  };

  const onSwitchSession = async () => {
    if (!accountMenuState) return;

    const { token, email } = accountMenuState;
    closeAccountMenu();
    setPendingToken(token);

    await authClient.multiSession.setActive({
      sessionToken: token,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          setPendingToken(null);
          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          await mutateDeviceSessions();
          setPendingToken(null);
          enqueueSnackbar(tAuth("switchSession.success", { email }), {
            variant: "success",
          });
        },
      },
    });
  };

  const displayName =
    getDisplayName(session?.user) || tAuth("profile.placeholderName");

  return (
    <>
      <FormCard component="form">
        <StyledCardHeader
          title={
            <Typography color="primary" fontWeight="bold" variant="h6">
              {tAuth("settings.accounts.manage")}
            </Typography>
          }
        />
        <StyledCardContent>
          <StyledListSubheader sx={{ p: 0, width: "100%" }}>
            <ListItemIcon>
              <StyledAvatar
                alt={displayName}
                src={session?.user.image || undefined}
              >
                {displayName[0]}
              </StyledAvatar>
            </ListItemIcon>
            <ListItemText
              primary={displayName}
              secondary={session?.user.email}
              slotProps={{ secondary: { variant: "caption" } }}
            />
            <Button
              loading={isMutatingLogout}
              onClick={handleLogout}
              size="small"
              startIcon={<Logout fontSize="small" />}
              sx={{ flexShrink: 0 }}
              variant="outlined"
            >
              {tAuth("signOut.label")}
            </Button>
          </StyledListSubheader>
          {otherSessions.map(({ session: { token }, user: sessionUser }) => {
            const sessionName = getDisplayName(sessionUser);
            const isLoading = pendingToken === token;

            return (
              <Fragment key={token}>
                <Divider flexItem />
                <StyledListSubheader sx={{ p: 0, width: "100%" }}>
                  <ListItemIcon>
                    <StyledAvatar
                      alt={sessionName}
                      src={sessionUser.image || undefined}
                    >
                      {sessionName[0]}
                    </StyledAvatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={sessionName}
                    secondary={sessionUser.email}
                    slotProps={{ secondary: { variant: "caption" } }}
                  />
                  <IconButton
                    aria-controls={
                      accountMenuState?.token === token
                        ? "session-menu"
                        : undefined
                    }
                    aria-expanded={
                      accountMenuState?.token === token ? "true" : undefined
                    }
                    aria-haspopup="true"
                    aria-label={sessionName}
                    disabled={isLoading}
                    onClick={(event) =>
                      onOpenAccountMenu(
                        event.currentTarget,
                        token,
                        sessionUser.email,
                      )
                    }
                    size="small"
                  >
                    <MoreHoriz />
                  </IconButton>
                </StyledListSubheader>
              </Fragment>
            );
          })}
        </StyledCardContent>
      </FormCard>
      <StyledMenu
        anchorEl={accountMenuState?.anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "top" }}
        id="session-menu"
        onClose={closeAccountMenu}
        open={Boolean(accountMenuState)}
        transformOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={onSwitchSession}>
          {tAuth("switchSession.switchTo")}
        </MenuItem>
        <MenuItem onClick={onRevokeSession} sx={{ color: "error.main" }}>
          {tAuth("settings.sessions.revoke")}
        </MenuItem>
      </StyledMenu>
    </>
  );
};

export default AuthSettingsAccountSessions;
