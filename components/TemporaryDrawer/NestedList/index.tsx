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

import { useOrganization } from "@/hooks/organizations";
import { useAuthNavItems } from "@/hooks/useAuth";
import { useCompanyNavItems } from "@/hooks/useCompany";
import { useRoutes } from "@/hooks/useRoutes";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Group,
  LocalMall,
  Person,
  Restaurant,
  Storefront,
  TableBar,
} from "@mui/icons-material";
import {
  Chip,
  Divider,
  type DividerProps,
  List,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Toolbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";
import type { OrderMode } from "@/types/orderMode";
import type { RouteParams } from "@/types/routeParams";

import { useAccountNavItems } from "@/utils/account";
import { getHref } from "@/utils/href";

const StyledChip = styled(Chip)(({ theme }) => ({
  marginLeft: "auto",
  padding: theme.spacing(0.5),
}));

interface StyledDividerProps extends DividerProps {
  level: number;
}

const StyledDivider = styled(Divider, {
  shouldForwardProp: (prop) => prop !== "level",
})<StyledDividerProps>(({ level, theme }) => ({
  marginBlock: theme.spacing(1),
  marginLeft: theme.spacing(level * 2),
}));

const divider: NavItem["slot"] = ({ level }) => (
  <StyledDivider component="li" level={level} />
);

const OrderModeMenuItem = ({
  level,
  mode,
  organizationSlug,
}: {
  level: number;
  mode: OrderMode;
  organizationSlug: string;
}) => {
  const organization = useOrganization();
  const storeName = organization?.name || "";

  const router = useRouter();
  const searchParams = useSearchParams();

  const navItem = useRoutes();
  const { icon: ModeIcon, label } = navItem(`/order/${mode}`);

  const tOrder = useTranslations("order");

  if (!storeName) return null;

  const partySize = searchParams.get("partySize");
  const tableNumber = searchParams.get("tableNumber");
  const type = searchParams.get("type");

  const storePath = `/order/${mode}/${organizationSlug}`;

  const extraByMode: Partial<
    Record<OrderMode, { icon: React.ReactElement; primary: string }[]>
  > = {
    [ORDER_MODE.DineIn]: [
      ...(tableNumber
        ? [
            {
              icon: <TableBar />,
              primary: tOrder("mode.dineIn.storeSlug.tableNumber.value", {
                tableNumber,
              }),
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
    ],
    [ORDER_MODE.Kiosk]: type
      ? [
          {
            icon: type === "dine-in" ? <Restaurant /> : <LocalMall />,
            primary: tOrder(
              type === "dine-in" ? "mode.kiosk.dineIn" : "mode.kiosk.takeout",
            ),
          },
        ]
      : [],
  };

  const hrefByMode: Partial<Record<OrderMode, string>> = {
    [ORDER_MODE.DineIn]: getHref(storePath, { tableNumber, partySize }),
    [ORDER_MODE.Kiosk]: `${storePath}?${searchParams.toString()}`,
  };

  const extra = extraByMode[mode] || [];

  return (
    <StyledListItemButton
      level={level}
      onClick={() => router.push(hrefByMode[mode] || storePath)}
      selected
    >
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
          {extra.map(({ icon, primary }, i) => (
            <Stack key={i} flexDirection="row" alignItems="center" gap={4}>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={primary} />
            </Stack>
          ))}
        </Stack>
        <StyledChip
          color="primary"
          icon={ModeIcon && <ModeIcon />}
          label={label}
          size="small"
          variant="outlined"
        />
      </Stack>
    </StyledListItemButton>
  );
};

const useNavItems = (): NavItem[] => {
  const { session } = useAuthStore((state) => state);

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const pathname = usePathname();

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const isAuthPage = pathname.startsWith("/auth");
  const isCompanyPage = pathname.startsWith("/company");

  const isAdmin = session?.user?.role === "admin";

  const accountChildren = useAccountNavItems(divider);

  const redirect =
    (isAuthPage || isCompanyPage) && redirectTo ? redirectTo : pathname;

  const authChildren = useAuthNavItems(redirect);

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

  const navItem = useRoutes({ defaultOrganization: defaultOrganizationSlug });

  const legalQuery = {
    [query.back]: pathname,
    [query.redirectTo]: redirectTo,
  };

  const companyChildren = useCompanyNavItems(legalQuery);

  const orderModeSlot: NavItem[] =
    mode && organizationSlug && mode !== ORDER_MODE.Pickup
      ? [
          {
            slot: ({ level }) => (
              <OrderModeMenuItem
                level={level}
                mode={mode}
                organizationSlug={organizationSlug}
              />
            ),
          },
        ]
      : [];

  const adminItems: NavItem[] = isAdmin
    ? [
        { slot: divider },
        navItem("/coupons"),
        navItem("/banners"),
        navItem("/admins"),
      ]
    : [];

  const orderChildren: NavItem[] = [
    ...orderModeSlot,
    navItem(`/order/${ORDER_MODE.Pickup}`),
  ];

  return [
    navItem("/dashboard"),
    {
      ...navItem("/order"),
      children: orderChildren,
    },
    ...(defaultOrganizationSlug ? [navItem("/orders"), navItem("/menus")] : []),
    navItem("/organizations"),
    ...adminItems,
    { slot: divider },
    {
      ...navItem("/auth"),
      children: session ? accountChildren : authChildren,
    },
    {
      ...navItem("/company"),
      children: companyChildren,
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
