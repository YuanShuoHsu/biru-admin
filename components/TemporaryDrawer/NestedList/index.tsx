// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import SelectedListItem from "./SelectedListItem";
import { StyledListItemButton } from "./SelectedListItem/ListItemLink";

import { ORDER_MODE } from "@/constants/orderMode";
import { query } from "@/constants/query";

import { useAuthMenuItems, useLogoutMenuItem } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";

import { usePathname } from "@/i18n/navigation";

import {
  AccountCircle,
  AdminPanelSettings,
  Business,
  Dashboard,
  Description,
  Group,
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
  Chip,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Toolbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { MenuItem } from "@/types/menuItem";
import type { RouteParams } from "@/types/routeParams";

import { useAddAccountMenuItem, useSettingsMenuItem } from "@/utils/account";
import { getHref } from "@/utils/href";
import { getStoreName } from "@/utils/stores";

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

// 等 order 完成後要修正
const DineInMenuItem = () => {
  const { locale, mode, storeSlug } = useParams<RouteParams>();

  const router = useRouter();

  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("tableNumber");
  const partySize = searchParams.get("partySize");

  const stores = useStores();
  const storeName = getStoreName(locale, stores, storeSlug);

  const tOrder = useTranslations("order");

  if (!storeName) return null;

  const handleClick = () =>
    router.push(
      getHref(`/order/${mode}/${storeSlug}`, { tableNumber, partySize }),
    );

  return (
    <StyledListItemButton onClick={handleClick} selected>
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

// 未來需要跟 breadcrumbs 一起復用重構
const useNavItems = (): MenuItem[] => {
  const { session } = useAuthStore((state) => state);

  const { mode, storeSlug } = useParams<RouteParams>();

  const pathname = usePathname();

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const isAuthPage = pathname.startsWith("/auth");
  const isCompanyPage = pathname.startsWith("/company");

  const isAdmin = session?.user?.role === "admin";

  const settingsItem = useSettingsMenuItem();
  const addAccountItem = useAddAccountMenuItem();
  const logoutMenuItem = useLogoutMenuItem();

  const accountChildren: MenuItem[] = [
    settingsItem,
    logoutMenuItem,
    { slot: ({ level = 0 }) => <StyledDivider level={level} /> },
    addAccountItem,
  ];

  const redirect =
    (isAuthPage || isCompanyPage) && redirectTo ? redirectTo : pathname;

  const authChildren = useAuthMenuItems(redirect);

  const tAdmin = useTranslations("admins");
  const tAuth = useTranslations("auth");
  const tCompany = useTranslations("company");
  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const tOrganizations = useTranslations("organizations");

  const dineInChildren: MenuItem[] = [
    ...(mode === ORDER_MODE.DineIn && storeSlug
      ? [{ slot: () => <DineInMenuItem /> }]
      : []),
    {
      icon: LocalMall,
      label: tOrder("mode.pickup.label"),
      to: `/${ORDER_MODE.Pickup}`,
    },
  ];

  return [
    { icon: Dashboard, label: tDashboard("label"), to: "/dashboard" },
    {
      children: dineInChildren,
      icon: ShoppingCart,
      label: tOrder("label"),
      to: "/order",
    },
    ...(isAdmin
      ? [
          {
            icon: AdminPanelSettings,
            label: tAdmin("label"),
            to: "/admins?page=1&pageSize=10",
          },
        ]
      : []),
    {
      icon: Business,
      label: tOrganizations("label"),
      to: "/organizations",
    },
    {
      children: session ? accountChildren : authChildren,
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
};

const NestedList = () => {
  const navItems = useNavItems();

  return (
    <List
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          <Toolbar />
        </ListSubheader>
      }
    >
      {navItems.map((item, index) => (
        <SelectedListItem item={item} key={item.to || index} />
      ))}
    </List>
  );
};

export default NestedList;
