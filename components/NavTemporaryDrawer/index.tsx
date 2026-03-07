"use client";

// https://mui.com/material-ui/react-drawer/#AnchorTemporaryDrawer.tsx
// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import useSWR from "swr";

import { ORDER_MODE } from "@/constants/orderMode";
import { query } from "@/constants/query";

import { useAuthMenuItems, useLogoutMenuItem } from "@/hooks/useAuth";

import { usePathname } from "@/i18n/navigation";

import {
  AccountCircle,
  Business,
  Description,
  ExpandMore,
  Group,
  Home,
  Info,
  LocalMall,
  Person,
  Restaurant,
  Security,
  ShoppingCart,
  Storefront,
  TableBar,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  Link,
  List,
  ListItemButton,
  type ListItemButtonProps,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDrawerStore } from "@/providers/drawer-store-provider";

import type { MenuItem } from "@/types/menuItem";
import type { Store, StoreName } from "@/types/stores";

import { RouteParams } from "@/types/routeParams";
import { useAccountMenuItems, useProfileMenuItems } from "@/utils/account";
import { handleDrawerToggle } from "@/utils/drawer";
import { getHref } from "@/utils/href";
import { getStoreName } from "@/utils/stores";

const StyledBox = styled(Box)({
  width: 250,
});

interface StyledListItemButtonProps extends ListItemButtonProps {
  level: number;
}

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "level",
})<StyledListItemButtonProps>(({ level, theme }) => ({
  paddingLeft: theme.spacing(2 + level * 2),
  gap: theme.spacing(4),

  "&.Mui-selected": {
    backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${level * 0.1}))`,

    "&:hover": {
      backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.hoverOpacity} + ${level * 0.1}))`,
    },
  },

  "& .MuiAvatar-root": {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },

  "& .MuiListItemIcon-root": {
    minWidth: 0,
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  marginLeft: "auto",
  padding: theme.spacing(0.5),
}));

const StyledDivider = styled(Divider, {
  shouldForwardProp: (prop) => prop !== "level",
})<{ level: number }>(({ level, theme }) => ({
  marginBlock: theme.spacing(1),
  marginLeft: theme.spacing(level * 2),
}));

const StyledExpandMore = styled(ExpandMore, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ open, theme }) => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: theme.transitions.create("transform"),
}));

const dividerSlot: MenuItem = {
  slot: ({ level }) => <StyledDivider level={level} />,
};

interface DineInMenuItemProps {
  level: number;
  onClick?: () => void;
  partySize?: string | null;
  storeName: StoreName;
  tableNumber?: string | null;
}

const DineInMenuItem = ({
  level,
  onClick,
  partySize,
  storeName,
  tableNumber,
}: DineInMenuItemProps) => {
  const tOrder = useTranslations("order");

  return (
    <StyledListItemButton level={level} onClick={onClick} selected={true}>
      <Stack
        width="100%"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Stack gap={1}>
          <Stack flexDirection="row" alignItems="center" gap={4}>
            <ListItemIcon>
              <Storefront />
            </ListItemIcon>
            <ListItemText primary={storeName} />
          </Stack>
          {tableNumber && (
            <Stack flexDirection="row" alignItems="center" gap={4}>
              <ListItemIcon>
                <TableBar />
              </ListItemIcon>
              <ListItemText
                primary={tOrder("mode.dineIn.storeSlug.tableNumber.value", {
                  tableNumber,
                })}
              />
            </Stack>
          )}
          {partySize && (
            <Stack flexDirection="row" alignItems="center" gap={4}>
              <ListItemIcon>
                {partySize === "1" ? <Person /> : <Group />}
              </ListItemIcon>
              <ListItemText
                primary={tOrder(
                  "mode.dineIn.storeSlug.tableNumber.partySize.select.value",
                  { count: partySize },
                )}
              />
            </Stack>
          )}
        </Stack>
        <StyledChip
          color="primary"
          icon={<Restaurant />}
          label={tOrder("mode.dineIn.label")}
          size="small"
          variant="outlined"
        />
      </Stack>
    </StyledListItemButton>
  );
};

const useNavItems = () => {
  const { session } = useAuthStore((state) => state);

  const { locale, mode, storeSlug } = useParams<RouteParams>();

  const pathname = usePathname();

  const router = useRouter();

  const { data: stores = [] } = useSWR<Store[]>("/api/stores");

  const searchParams = useSearchParams();

  const tableNumber = searchParams.get("tableNumber");
  const partySize = searchParams.get("partySize");
  const redirectTo = searchParams.get("redirectTo");
  const isAccountPage = pathname.startsWith("/account");
  const isAuthPage = pathname.startsWith("/auth");
  const isCompanyPage = pathname.startsWith("/company");

  const accountChildren = [
    ...useProfileMenuItems(),
    dividerSlot,
    ...useAccountMenuItems(),
    useLogoutMenuItem(),
  ];

  const redirect =
    (isAccountPage || isAuthPage || isCompanyPage) && redirectTo
      ? redirectTo
      : pathname;

  const authChildren = useAuthMenuItems(redirect);

  const storeName = getStoreName(locale, stores, storeSlug);

  const tHome = useTranslations("home");
  const tOrder = useTranslations("order");
  const tAuth = useTranslations("auth");
  const tAccount = useTranslations("account");
  const tCompany = useTranslations("company");

  const dineInChildren: MenuItem[] = [
    ...(mode === ORDER_MODE.DineIn && storeSlug && storeName
      ? [
          {
            slot: ({ level }: { level: number }) => (
              <DineInMenuItem
                level={level}
                onClick={() =>
                  router.push(
                    getHref(`/order/${mode}/${storeSlug}`, {
                      tableNumber,
                      partySize,
                    }),
                  )
                }
                partySize={partySize}
                storeName={storeName}
                tableNumber={tableNumber}
              />
            ),
          },
        ]
      : []),
    {
      icon: LocalMall,
      label: tOrder("mode.pickup.label"),
      to: `/${ORDER_MODE.Pickup}`,
    },
  ];

  const navItems: MenuItem[] = [
    { icon: Home, label: tHome("label"), to: "/" },
    {
      children: dineInChildren,
      icon: ShoppingCart,
      label: tOrder("label"),
      to: "/order",
    },
    session
      ? {
          children: accountChildren,
          icon: AccountCircle,
          label: tAccount("label"),
          to: "/account",
        }
      : {
          children: authChildren,
          icon: AccountCircle,
          label: tAuth("label"),
          to: "/auth",
        },
    {
      children: [
        {
          icon: Info,
          label: tCompany("about.label"),
          to: "/about",
        },
        {
          icon: Description,
          label: tCompany("legal.terms.label"),
          to: getHref("/terms", {
            [query.back]: pathname,
            [query.redirectTo]: redirectTo,
          }),
        },
        {
          icon: Security,
          label: tCompany("legal.privacy.label"),
          to: getHref("/privacy", {
            [query.back]: pathname,
            [query.redirectTo]: redirectTo,
          }),
        },
      ],
      icon: Business,
      label: tCompany("label"),
      to: "/company",
    },
  ];

  return navItems;
};

interface ListItemLinkProps extends ListItemButtonProps {
  href?: string;
  icon?: React.ElementType;
  isExpandable?: boolean;
  label?: string;
  level: number;
  open?: boolean;
}

const ListItemLink = ({
  href,
  icon: Icon,
  isExpandable,
  label,
  level,
  onClick,
  open,
  selected,
  ...other
}: ListItemLinkProps) => (
  <StyledListItemButton
    {...(href ? { component: Link, href } : {})}
    level={level}
    onClick={onClick}
    selected={selected}
    {...other}
  >
    {Icon && (
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
    )}
    <ListItemText primary={label} />
    {isExpandable && <StyledExpandMore open={open} />}
  </StyledListItemButton>
);

const NavTemporaryDrawer = () => {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const { drawer, setDrawerOpen } = useDrawerStore((state) => state);
  const open = drawer.nav;
  const handleNavClose = handleDrawerToggle(setDrawerOpen, "nav", false);

  const navItems = useNavItems();

  const pathname = usePathname();

  const handleIconButtonToggle = (key: string) =>
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderItems = (items: MenuItem[], level = 0, parentPath = "/") =>
    items.map(({ children, disabled, icon, label, onClick, slot, to }) => {
      const [toPath, toSearchParams] = to?.split("?") || [];
      const search = toSearchParams || "";
      const queryString = search ? `?${search}` : "";

      const parentPrefix = parentPath === "/" ? "" : parentPath;
      const basePath = toPath ? `${parentPrefix}${toPath}` : parentPath;
      const isExpandable = Boolean(children?.length);
      const href =
        to && !isExpandable ? `${basePath}${queryString}` : undefined;

      const itemKey = toPath || `${label}-${level}`;
      const open = Boolean(isExpandable && openMap[itemKey]);
      const selected =
        basePath === "/"
          ? pathname === basePath
          : pathname === basePath || pathname.startsWith(`${basePath}/`);

      const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isExpandable) {
          event.stopPropagation();

          if (to) handleIconButtonToggle(itemKey);

          return;
        }

        onClick?.();
      };

      return (
        <Fragment key={itemKey}>
          {slot ? (
            slot({ level })
          ) : (
            <ListItemLink
              disabled={disabled}
              href={href}
              icon={icon}
              isExpandable={isExpandable}
              label={label}
              level={level}
              onClick={handleClick}
              open={open}
              selected={selected}
            />
          )}
          {isExpandable && (
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderItems(children!, level + 1, basePath)}
              </List>
            </Collapse>
          )}
        </Fragment>
      );
    });

  const list = (
    <StyledBox
      onClick={handleNavClose}
      onKeyDown={handleNavClose}
      role="presentation"
    >
      <Toolbar />
      <Divider />
      <List component="nav">{renderItems(navItems)}</List>
    </StyledBox>
  );

  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      onClose={handleNavClose}
      open={open}
    >
      {list}
    </Drawer>
  );
};

export default NavTemporaryDrawer;
