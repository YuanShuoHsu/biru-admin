// https://mui.com/material-ui/react-app-bar/#MenuAppBar.tsx
// https://mui.com/material-ui/react-app-bar/#ResponsiveAppBar.tsx
// https://mui.com/material-ui/react-menu/#AccountMenu.tsx
// https://mui.com/material-ui/react-tooltip/#DisabledTooltips.tsx

"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, type MouseEvent } from "react";

import BadgeAvatars from "@/components/BadgeAvatars";

import { query } from "@/constants/query";

import { useLogoutMenuItem } from "@/hooks/useAuth";

import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { AccountCircle } from "@mui/icons-material";
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { MenuItem as MenuItemData } from "@/types/menuItem";

import {
  useAccountSettingsMenuItem,
  useAddAnotherAccountMenuItem,
} from "@/utils/account";
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
    marginBlock: theme.spacing(0.5),
  },
}));

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  backgroundImage: "var(--Paper-overlay)",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledHeaderAvatar = styled(StyledAvatar)(({ theme }) => ({
  width: 36,
  height: 36,
  border: `1px solid ${theme.vars.palette.primary.main}`,
  fontSize: 18,

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

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { session } = useAuthStore((state) => state);

  const displayName = getDisplayName(session?.user);

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tooltipTitle = session
    ? tAccount("accountSettings.label")
    : tAuth("signIn.label");

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const isAccountPage = pathname.startsWith("/account");
  const isAuthPage = pathname.startsWith("/auth");
  const isCompanyPage = pathname.startsWith("/company");

  const redirectTarget = isAuthPage
    ? redirectTo
    : (isAccountPage || isCompanyPage) && redirectTo
      ? redirectTo
      : pathname;

  const signInRedirectHref = getHref("/auth/sign-in", {
    [query.redirectTo]: redirectTarget,
  });

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!session) {
      router.push(signInRedirectHref);

      return;
    }

    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const accountSettingsItem = useAccountSettingsMenuItem();
  const addAnotherAccountItem = useAddAnotherAccountMenuItem();
  const logoutMenuItem = useLogoutMenuItem();

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
            <StyledHeaderAvatar
              alt={displayName}
              isSignedIn
              src={session.user.image || undefined}
            >
              {displayName[0]}
            </StyledHeaderAvatar>
            <Stack gap={1}>
              <Typography fontWeight="bold" variant="body2">
                {displayName}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {session.user.email}
              </Typography>
            </Stack>
          </StyledListSubheader>
        )}
        <Divider />
        {renderMenuItems(pathname, "/account", [
          accountSettingsItem,
          logoutMenuItem,
        ])}
        <Divider />
        {renderMenuItems(pathname, "/account", [addAnotherAccountItem])}
      </StyledMenu>
    </>
  );
};

export default AccountMenu;
