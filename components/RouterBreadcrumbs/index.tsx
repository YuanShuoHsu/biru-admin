// https://mui.com/material-ui/react-breadcrumbs/#CondensedWithMenu.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-IconBreadcrumbs.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-RouterBreadcrumbs.tsx

"use client";

import { useState } from "react";

import { useRoutes } from "@/hooks/useRoutes";

import { Link, usePathname } from "@/i18n/navigation";

import { MoreHoriz } from "@mui/icons-material";
import {
  Breadcrumbs,
  IconButton,
  LinkProps,
  Menu,
  type MenuItemProps,
  Link as MuiLink,
  MenuItem as MuiMenuItem,
  Typography,
} from "@mui/material";
import { type CSSObject, styled, type Theme } from "@mui/material/styles";

import type { NavItem } from "@/types/navItem";

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  flex: 1,
  transition: "none",

  "& .MuiBreadcrumbs-separator": {
    transition: theme.transitions.create("color"),
  },

  "& .MuiSvgIcon-root": {
    transition: "none",
  },
}));

const iconTextBaseStyles = (theme: Theme): CSSObject => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(0.5),
  overflowWrap: "anywhere",

  "& > .MuiSvgIcon-root": {
    marginTop: "calc((1lh - 1em) / 2)",
  },
});

const StyledTypography = styled(Typography)(({ theme }) => ({
  ...iconTextBaseStyles(theme),
}));

const StyledLink = styled(MuiLink)<LinkProps>(({ theme }) => ({
  ...iconTextBaseStyles(theme),
}));

const StyledMenuItem = styled(MuiMenuItem)<MenuItemProps>(({ theme }) => ({
  ...iconTextBaseStyles(theme),
}));

const ITEMS_BEFORE_COLLAPSE = 1;
const ITEMS_AFTER_COLLAPSE = 2;
const MAX_ITEMS = ITEMS_BEFORE_COLLAPSE + ITEMS_AFTER_COLLAPSE + 1;

const RouterBreadcrumbs = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const navItem = useRoutes();

  const pathnames = usePathname().split("/").filter(Boolean);

  const segments = pathnames.map((_, index) =>
    navItem(`/${pathnames.slice(0, index + 1).join("/")}`),
  );

  const lastSegment = segments.at(-1);
  const isCollapsed = segments.length > MAX_ITEMS;
  const afterStart = segments.length - ITEMS_AFTER_COLLAPSE;
  const collapsedItems = segments.slice(ITEMS_BEFORE_COLLAPSE, afterStart);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement> | null) => {
    if (event) setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const renderSegment = (segment: NavItem) => {
    const { icon: Icon, label, path, to } = segment;
    const isLast = segment === lastSegment;
    const isText = isLast || !to;
    const color = isLast ? "text.primary" : "text.secondary";

    return isText ? (
      <StyledTypography color={color} key={path}>
        {Icon && <Icon fontSize="inherit" />}
        {label}
      </StyledTypography>
    ) : (
      <StyledLink
        color="text.secondary"
        component={Link}
        href={to}
        key={path}
        underline="always"
      >
        {Icon && <Icon fontSize="inherit" />}
        {label}
      </StyledLink>
    );
  };

  return (
    <>
      {isCollapsed && (
        <Menu
          anchorEl={anchorEl}
          aria-labelledby="breadcrumbs-menu-trigger"
          onClose={handleClose}
          open={open}
        >
          {collapsedItems.map(({ icon: Icon, label, path, to }) => (
            <StyledMenuItem
              disabled={!to}
              key={path}
              onClick={handleClose}
              {...(to ? { component: Link, href: to } : {})}
            >
              {Icon && <Icon fontSize="inherit" />}
              {label}
            </StyledMenuItem>
          ))}
        </Menu>
      )}
      <StyledBreadcrumbs aria-label="breadcrumb">
        {isCollapsed
          ? [
              ...segments.slice(0, ITEMS_BEFORE_COLLAPSE).map(renderSegment),
              <IconButton
                aria-expanded={open ? "true" : undefined}
                aria-haspopup="true"
                aria-label="show more breadcrumbs"
                color="inherit"
                id="breadcrumbs-menu-trigger"
                key="collapsed-trigger"
                onClick={handleOpen}
                size="small"
              >
                <MoreHoriz fontSize="inherit" />
              </IconButton>,
              ...segments.slice(afterStart).map(renderSegment),
            ]
          : segments.map(renderSegment)}
      </StyledBreadcrumbs>
    </>
  );
};

export default RouterBreadcrumbs;
