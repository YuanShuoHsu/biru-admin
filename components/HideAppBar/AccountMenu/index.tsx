// https://mui.com/material-ui/react-app-bar/#MenuAppBar.tsx
// https://mui.com/material-ui/react-app-bar/#ResponsiveAppBar.tsx
// https://mui.com/material-ui/react-menu/#AccountMenu.tsx
// https://mui.com/material-ui/react-tooltip/#DisabledTooltips.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useState, type MouseEvent } from "react";
import useSWR from "swr";

import BadgeAvatars from "@/components/BadgeAvatars";

import { query } from "@/constants/query";
import { swrKeys } from "@/constants/swr";

import { useAuthMenuItems, useLogoutMenuItem } from "@/hooks/useAuth";

import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { AccountCircle } from "@mui/icons-material";
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  listItemIconClasses,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItem as MenuItemData } from "@/types/menuItem";

import { useAddAccountMenuItem, useSettingsMenuItem } from "@/utils/account";
import { getDisplayName } from "@/utils/auth";
import { getHref } from "@/utils/href";

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "isSignedIn",
})<{ isSignedIn: boolean }>(({ isSignedIn, theme }) => ({
  width: 24,
  height: 24,
  backgroundColor: isSignedIn
    ? theme.vars.palette.background.paper
    : "transparent",
  color: isSignedIn ? theme.vars.palette.primary.main : "inherit",
  fontSize: 12,

  ...(isSignedIn && {
    [theme.getColorSchemeSelector("dark")]: {
      backgroundColor: theme.vars.palette.common.white,
      color: theme.vars.palette.primary.contrastText,
    },
  }),
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: theme.spacing(6),

  [theme.breakpoints.up("sm")]: {
    marginTop: theme.spacing(7),
  },

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

const StyledListAvatar = styled(StyledAvatar)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.primary.main}`,

  [theme.getColorSchemeSelector("dark")]: {
    borderColor: theme.vars.palette.common.white,
  },
}));

const renderMenuItems = (
  pathname: string,
  basePath: string,
  items: MenuItemData[],
) =>
  items.map(({ disabled, icon: Icon, label, onClick, to }, index) => {
    const key = to || index;
    const href = to && `${basePath}${to}`;
    const selected = href
      ? pathname === href || pathname.startsWith(`${href}/`)
      : false;

    return (
      <MenuItem
        disabled={disabled}
        key={key}
        onClick={onClick}
        selected={selected}
        {...(href ? { component: Link, href } : {})}
      >
        {Icon && (
          <ListItemIcon>
            <Icon fontSize="small" />
          </ListItemIcon>
        )}
        <ListItemText primary={label} />
      </MenuItem>
    );
  });

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);
  const displayName = getDisplayName(session?.user);

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const isAuthPage = pathname.startsWith("/auth");
  const isCompanyPage = pathname.startsWith("/company");

  const redirectTarget =
    (isAuthPage || isCompanyPage) && redirectTo ? redirectTo : pathname;

  const signInRedirectHref = getHref("/auth/sign-in", {
    [query.redirectTo]: redirectTarget,
  });

  const { enqueueSnackbar } = useSnackbar();

  const { data: deviceSessions = [] } = useSWR<DeviceSession[]>(
    session ? swrKeys.deviceSessions : null,
    async () => {
      const { data } = await authClient.multiSession.listDeviceSessions();

      return data || [];
    },
  );

  const otherSessions = deviceSessions.filter(
    ({ session: { token } }) => token !== session?.session.token,
  );

  const tAuth = useTranslations("auth");
  const tooltipTitle = session
    ? tAuth("settings.account.label")
    : tAuth("label");

  const addAccountItem = useAddAccountMenuItem();
  const authMenuItems = useAuthMenuItems(redirectTarget || undefined);
  const logoutMenuItem = useLogoutMenuItem();
  const settingsItem = useSettingsMenuItem();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!session) {
      router.push(signInRedirectHref);

      return;
    }

    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSetActiveConfirm = async (
    sessionToken: string,
    email: string,
  ) => {
    await authClient.multiSession.setActive({
      sessionToken,
      fetchOptions: {
        onError: ({ error }) => {
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          enqueueSnackbar(tAuth("switchSession.success", { email }), {
            variant: "success",
          });
        },
      },
    });
  };

  const handleSetActiveDialog = (sessionToken: string, email: string) =>
    setDialog({
      contentText: tAuth("switchSession.confirmContentText", { email }),
      onConfirm: () => handleSetActiveConfirm(sessionToken, email),
      open: true,
      title: tAuth("switchSession.label"),
    });

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <span>
          <IconButton
            aria-controls={open ? "account-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            aria-label="account of current user"
            color="inherit"
            onClick={handleClick}
          >
            <BadgeAvatars invisible={!session} variant="dot">
              <StyledAvatar
                alt={displayName}
                isSignedIn={!!session}
                src={session?.user.image || undefined}
              >
                {!session ? <AccountCircle /> : displayName[0]}
              </StyledAvatar>
            </BadgeAvatars>
          </IconButton>
        </span>
      </Tooltip>
      <StyledMenu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "top" }}
        id="account-menu"
        keepMounted
        onClick={handleClose}
        onClose={handleClose}
        open={open}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {session && (
          <StyledListSubheader>
            <ListItemIcon>
              <StyledListAvatar
                alt={displayName}
                isSignedIn
                src={session.user.image || undefined}
              >
                {displayName[0]}
              </StyledListAvatar>
            </ListItemIcon>
            <ListItemText
              primary={displayName}
              secondary={session.user.email}
              slotProps={{ secondary: { variant: "caption" } }}
            />
          </StyledListSubheader>
        )}
        {!session && (
          <StyledListSubheader>{tAuth("label")}</StyledListSubheader>
        )}
        <Divider />
        {session &&
          renderMenuItems(pathname, "/auth", [settingsItem, logoutMenuItem])}
        {session && <Divider />}
        {session &&
          otherSessions.map(({ session: { token }, user }) => {
            const name = getDisplayName(user);

            return (
              <MenuItem
                key={token}
                onClick={() => handleSetActiveDialog(token, user.email)}
              >
                <ListItemIcon>
                  <StyledListAvatar
                    alt={name}
                    isSignedIn
                    src={user.image || undefined}
                  >
                    {name[0]}
                  </StyledListAvatar>
                </ListItemIcon>
                <ListItemText
                  primary={name}
                  secondary={user.email}
                  slotProps={{ secondary: { variant: "caption" } }}
                />
              </MenuItem>
            );
          })}
        {session && otherSessions.length > 0 && <Divider />}
        {session && renderMenuItems(pathname, "/auth", [addAccountItem])}
        {!session && renderMenuItems(pathname, "/auth", authMenuItems)}
      </StyledMenu>
    </>
  );
};

export default AccountMenu;
