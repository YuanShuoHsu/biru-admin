// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";

import SelectedListItem from "./SelectedListItem";
import { StyledListItemButton } from "./SelectedListItem/ListItemLink";

import { ORDER_MODE } from "@/constants/orderMode";
import { query } from "@/constants/query";

import { DEFAULT_DASHBOARD_RANGE } from "@/app/[locale]/(app)/(dashboard)/dashboard/definitions";

import { useOrganization } from "@/hooks/organizations";
import { useAuthMenuItems, useLogoutMenuItem } from "@/hooks/useAuth";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  AccountCircle,
  AdminPanelSettings,
  Assignment,
  Business,
  ConfirmationNumber,
  Dashboard,
  Description,
  Group,
  Info,
  LocalMall,
  MenuBook,
  Person,
  QrCodeScanner,
  Restaurant,
  Security,
  ShoppingCart,
  Storefront,
  TableBar,
  TouchApp,
  ViewCarousel,
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

const OrderModeMenuItem = ({
  chipIcon,
  chipLabel,
  extra,
  level,
  onClick,
}: {
  chipIcon: React.ReactElement;
  chipLabel: string;
  extra?: { icon: React.ReactElement; primary: string }[];
  level: number;
  onClick: () => void;
}) => {
  const organization = useOrganization();
  const storeName = organization?.name || "";

  if (!storeName) return null;

  return (
    <StyledListItemButton level={level} onClick={onClick} selected>
      <Stack
        width="100%"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        <Stack gap={1}>
          <Stack flexDirection="row" alignItems="center" gap={4}>
            <ListItemIcon>
              <Storefront />
            </ListItemIcon>
            <ListItemText primary={storeName} />
          </Stack>
          {extra?.map(({ icon, primary }, i) => (
            <Stack key={i} flexDirection="row" alignItems="center" gap={4}>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={primary} />
            </Stack>
          ))}
        </Stack>
        <StyledChip
          color="primary"
          icon={chipIcon}
          label={chipLabel}
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

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const tableNumber = searchParams.get("tableNumber");
  const partySize = searchParams.get("partySize");
  const type = searchParams.get("type");

  const isAuthPage = pathname.startsWith("/auth");
  const isCompanyPage = pathname.startsWith("/company");

  const isAdmin = session?.user?.role === "admin";

  const settingsItem = useSettingsMenuItem();
  const addAccountItem = useAddAccountMenuItem();
  const logoutMenuItem = useLogoutMenuItem();

  const accountChildren: MenuItem[] = [
    settingsItem,
    logoutMenuItem,
    { slot: ({ level }) => <StyledDivider level={level} /> },
    addAccountItem,
  ];

  const redirect =
    (isAuthPage || isCompanyPage) && redirectTo ? redirectTo : pathname;

  const authChildren = useAuthMenuItems(redirect);

  const { data: defaultOrganizationSlug = "" } = useSWR<string>(
    "default-organization-slug",
    async () => {
      const [{ data: session }, { data: organizations }] = await Promise.all([
        authClient.getSession(),
        authClient.organization.list(),
      ]);

      return (
        organizations?.find(
          ({ id }) => id === session?.session?.activeOrganizationId,
        )?.slug ||
        organizations?.[0]?.slug ||
        ""
      );
    },
  );

  const tAdmin = useTranslations("admins");
  const tAuth = useTranslations("auth");
  const tBanners = useTranslations("banners");
  const tCompany = useTranslations("company");
  const tCoupons = useTranslations("coupons");
  const tDashboard = useTranslations("dashboard");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");
  const tOrganizations = useTranslations("organizations");

  const counterSlot: MenuItem[] =
    mode === ORDER_MODE.Counter && organizationSlug
      ? [
          {
            slot: ({ level }) => (
              <OrderModeMenuItem
                chipIcon={<QrCodeScanner />}
                chipLabel={tOrder("mode.counter.label")}
                level={level}
                onClick={() =>
                  router.push(
                    `/order/${ORDER_MODE.Counter}/${organizationSlug}`,
                  )
                }
              />
            ),
          },
        ]
      : [];

  const dineInSlot: MenuItem[] =
    mode === ORDER_MODE.DineIn && organizationSlug
      ? [
          {
            slot: ({ level }) => (
              <OrderModeMenuItem
                chipIcon={<Restaurant />}
                chipLabel={tOrder("mode.dineIn.label")}
                extra={[
                  ...(tableNumber
                    ? [
                        {
                          icon: <TableBar />,
                          primary: tOrder(
                            "mode.dineIn.storeSlug.tableNumber.value",
                            { tableNumber },
                          ),
                        },
                      ]
                    : []),
                  ...(partySize
                    ? [
                        {
                          icon: partySize === "1" ? <Person /> : <Group />,
                          primary: tOrder(
                            "mode.dineIn.storeSlug.tableNumber.partySize.select.value",
                            { count: partySize },
                          ),
                        },
                      ]
                    : []),
                ]}
                level={level}
                onClick={() =>
                  router.push(
                    getHref(`/order/${ORDER_MODE.DineIn}/${organizationSlug}`, {
                      tableNumber,
                      partySize,
                    }),
                  )
                }
              />
            ),
          },
        ]
      : [];

  const kioskSlot: MenuItem[] =
    mode === ORDER_MODE.Kiosk && organizationSlug
      ? [
          {
            slot: ({ level }) => (
              <OrderModeMenuItem
                chipIcon={<TouchApp />}
                chipLabel={tOrder("mode.kiosk.label")}
                extra={
                  type
                    ? [
                        {
                          icon:
                            type === "dine-in" ? <Restaurant /> : <LocalMall />,
                          primary: tOrder(
                            type === "dine-in"
                              ? "mode.kiosk.dineIn"
                              : "mode.kiosk.takeout",
                          ),
                        },
                      ]
                    : []
                }
                level={level}
                onClick={() =>
                  router.push(
                    `/order/${ORDER_MODE.Kiosk}/${organizationSlug}?${searchParams.toString()}`,
                  )
                }
              />
            ),
          },
        ]
      : [];

  const orderChildren: MenuItem[] = [
    ...counterSlot,
    ...dineInSlot,
    ...kioskSlot,
    {
      icon: LocalMall,
      label: tOrder("mode.pickup.label"),
      to: `/${ORDER_MODE.Pickup}`,
    },
  ];

  return [
    {
      icon: Dashboard,
      label: tDashboard("label"),
      to: getHref("/dashboard", {
        organization: defaultOrganizationSlug,
        range: DEFAULT_DASHBOARD_RANGE,
      }),
    },
    {
      children: orderChildren,
      icon: ShoppingCart,
      label: tOrder("label"),
      to: "/order",
    },
    ...(defaultOrganizationSlug
      ? [
          {
            icon: Assignment,
            label: tOrders("label"),
            to: `/orders/list?organization=${defaultOrganizationSlug}&page=1&pageSize=10`,
          },
          {
            icon: MenuBook,
            label: tMenus("label"),
            to: `/menus/sections?organization=${defaultOrganizationSlug}&page=1&pageSize=10`,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            icon: ConfirmationNumber,
            label: tCoupons("label"),
            to: "/coupons?page=1&pageSize=10",
          },
          {
            icon: ViewCarousel,
            label: tBanners("label"),
            to: "/banners?page=1&pageSize=10",
          },
        ]
      : []),
    {
      icon: Business,
      label: tOrganizations("label"),
      to: "/organizations",
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
