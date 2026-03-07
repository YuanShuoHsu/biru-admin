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
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { MenuItem as MenuItemData } from "@/types/menuItem";

import { useAccountMenuItems, useProfileMenuItems } from "@/utils/account";
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
  transition: theme.transitions.create(["background-color", "color"]),

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

  "& .MuiPaper-root": {
    "& .MuiAvatar-root": {
      width: theme.spacing(2.5),
      height: theme.spacing(2.5),
    },

    "& .MuiListItemIcon-root": {
      minWidth: 0,
    },

    "& .MuiMenuItem-root": {
      gap: theme.spacing(2),
    },
  },
}));

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

  const redirectTarget =
    (isAccountPage || isAuthPage || isCompanyPage) && redirectTo
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

  const profileMenuItems = useProfileMenuItems();
  const accountMenuItems = [...useAccountMenuItems(), useLogoutMenuItem()];

  const renderMenuItems = (items: MenuItemData[]) =>
    items.map(({ disabled, icon: Icon, label, onClick, to }, index) => {
      const key = to || index;
      const href = to && `/account${to}`;

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
        {renderMenuItems(profileMenuItems)}
        <Divider />
        {renderMenuItems(accountMenuItems)}
      </StyledMenu>
    </>
  );
};

export default AccountMenu;
