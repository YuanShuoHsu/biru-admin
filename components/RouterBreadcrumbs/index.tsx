// https://mui.com/material-ui/react-breadcrumbs/#CondensedWithMenu.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-IconBreadcrumbs.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-RouterBreadcrumbs.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { ORDER_MODE } from "@/constants/orderMode";

import { Link, usePathname } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  AccountCircle,
  AdminPanelSettings,
  Business,
  Category,
  Checklist,
  Dashboard,
  ConfirmationNumber,
  DeleteForever,
  Devices,
  Restaurant,
  Email,
  Extension,
  Fastfood,
  Gavel,
  Group,
  Groups,
  HelpOutline,
  Info,
  ListAlt,
  LocalOffer,
  LocationOn,
  Lock,
  LockReset,
  Login,
  Mail,
  ManageAccounts,
  MenuBook,
  MoreHoriz,
  Payment,
  People,
  Person,
  PersonAdd,
  Pets,
  Policy,
  QrCodeScanner,
  ReceiptLong,
  Settings,
  ShoppingCart,
  Stars,
  Storefront,
  LocalMall,
  TouchApp,
  Tune,
} from "@mui/icons-material";
import {
  Breadcrumbs,
  IconButton,
  LinkProps,
  Menu,
  type MenuItemProps,
  Link as MuiLink,
  MenuItem as MuiMenuItem,
  type SvgIconProps,
  Typography,
} from "@mui/material";
import { type CSSObject, styled, type Theme } from "@mui/material/styles";

import type { MenuItem, MenuSection, ModifierGroup } from "@/types/menus";
import type { RouteParams } from "@/types/routeParams";

import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { localize } from "@/utils/locale";

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

interface BreadcrumbItem {
  children?: BreadcrumbItem[];
  disabled?: boolean;
  hidden?: boolean;
  icon: React.ComponentType<SvgIconProps>;
  label?: string;
  to: string;
}

const useBreadcrumbs = (organizationName: string): BreadcrumbItem[] => {
  const locale = useLocale();

  const {
    groupId,
    menuItemId,
    menuSectionId,
    mode,
    organizationSlug,
    slug,
    teamId,
    userId,
  } = useParams<RouteParams>();

  const searchParams = useSearchParams();
  const menuOrganizationSlug = searchParams.get("organization");
  const menusQuery = new URLSearchParams({
    ...(menuOrganizationSlug && { organization: menuOrganizationSlug }),
    page: "1",
    pageSize: "10",
  }).toString();

  const { data: userEmail = "" } = useSWR(
    userId ? `admin-user-${userId}` : null,
    async () => {
      const { data } = await authClient.admin.getUser({
        query: { id: userId },
      });

      return data?.email;
    },
  );

  const decodedSlug = decodeURIComponent(slug);
  const { data: organizationData } = useSWR(
    slug ? `organization-${slug}` : null,
    async () => {
      const { data } = await authClient.organization.getFullOrganization({
        query: { organizationSlug: decodedSlug },
      });

      return data;
    },
  );
  const organizationSlugName = organizationData?.name || "";
  const teamName =
    organizationData?.teams.find(({ id }) => id === teamId)?.name || "";

  const { data: menuSectionName = "" } = useSWR(
    menuSectionId ? `/api/menu-sections/${menuSectionId}` : null,
    async (url) => {
      try {
        const { name } = await fetcher<MenuSection>(url);

        return localize(name, locale);
      } catch {
        return "";
      }
    },
  );

  const { data: menuItemName = "" } = useSWR(
    menuItemId ? `/api/menu-items/${menuItemId}` : null,
    async (url) => {
      try {
        const { name } = await fetcher<MenuItem>(url);

        return localize(name, locale);
      } catch {
        return "";
      }
    },
  );

  const { data: modifierGroupName = "" } = useSWR(
    groupId ? `/api/modifier-groups/${groupId}` : null,
    async (url) => {
      try {
        const { displayName } = await fetcher<ModifierGroup>(url);

        return localize(displayName, locale);
      } catch {
        return "";
      }
    },
  );

  const tAdmins = useTranslations("admins");
  const tAuth = useTranslations("auth");
  const tCompany = useTranslations("company");
  const tCoupons = useTranslations("coupons");
  const tDashboard = useTranslations("dashboard");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");
  const tOrganizations = useTranslations("organizations");

  const modeLabelMap: Partial<Record<string, string>> = {
    [ORDER_MODE.Counter]: tOrder("mode.counter.label"),
    [ORDER_MODE.DineIn]: tOrder("mode.dineIn.label"),
    [ORDER_MODE.Kiosk]: tOrder("mode.kiosk.label"),
    [ORDER_MODE.Pickup]: tOrder("mode.pickup.label"),
  };
  const modeLabel = (mode && modeLabelMap[mode]) || mode || "";

  const modeIconMap: Record<string, React.ComponentType<SvgIconProps>> = {
    [ORDER_MODE.Counter]: QrCodeScanner,
    [ORDER_MODE.DineIn]: Restaurant,
    [ORDER_MODE.Kiosk]: TouchApp,
    [ORDER_MODE.Pickup]: LocalMall,
  };
  const modeIcon: React.ComponentType<SvgIconProps> = mode
    ? modeIconMap[mode]
    : ShoppingCart;

  const partySize = searchParams.get("partySize");
  const tableNumber = searchParams.get("tableNumber");
  const storeTo = getHref(`/${organizationSlug}`, { partySize, tableNumber });

  const storeChildren: BreadcrumbItem[] = [
    {
      icon: ShoppingCart,
      label: tOrder("mode.storeSlug.tableNumber.stepper.cart.label"),
      to: "/cart",
    },
    {
      icon: Payment,
      label: tOrder("mode.storeSlug.tableNumber.stepper.checkout.label"),
      to: "/checkout",
    },
    {
      icon: Pets,
      label: tOrder("mode.storeSlug.tableNumber.stepper.complete.label"),
      to: "/complete",
    },
  ];

  const orderChildren: BreadcrumbItem[] = [
    {
      children: [
        {
          children: storeChildren,
          icon: Storefront,
          label: organizationName,
          to: storeTo,
        },
      ],
      disabled: true,
      icon: modeIcon,
      label: modeLabel,
      to: `/${mode}`,
    },
  ];

  return [
    {
      icon: Dashboard,
      label: tDashboard("label"),
      to: "/dashboard",
    },
    {
      children: [
        {
          icon: Devices,
          label: userEmail,
          to: `/${userId}`,
        },
      ],
      icon: AdminPanelSettings,
      label: tAdmins("label"),
      to: "/admins",
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      icon: LocalOffer,
                      label: tMenus("items.offers.label"),
                      to: "/offers",
                    },
                    {
                      icon: Extension,
                      label: tMenus("items.addOns.label"),
                      to: "/add-ons",
                    },
                    {
                      icon: Tune,
                      label: tMenus("items.modifierGroups.label"),
                      to: "/modifier-groups",
                    },
                  ],
                  disabled: true,
                  icon: Fastfood,
                  label: menuItemName,
                  to: `/${menuItemId}`,
                },
              ],
              icon: ListAlt,
              label: menuSectionName,
              to: `/${menuSectionId}?${menusQuery}`,
            },
          ],
          icon: Category,
          label: tMenus("sections.label"),
          to: `/sections?${menusQuery}`,
        },
        {
          children: [
            {
              icon: Checklist,
              label: modifierGroupName,
              to: `/${groupId}`,
            },
          ],
          icon: Tune,
          label: tMenus("modifierGroups.label"),
          to: `/modifier-groups?${menusQuery}`,
        },
      ],
      disabled: true,
      icon: MenuBook,
      label: tMenus("label"),
      to: `/menus?${menusQuery}`,
    },
    {
      children: [
        {
          icon: Login,
          label: tAuth("signIn.label"),
          to: "/sign-in",
        },
        {
          icon: PersonAdd,
          label: tAuth("signUp.label"),
          to: "/sign-up",
        },
        {
          icon: Email,
          label: tAuth("verifyEmail.label"),
          to: "/verify-email",
        },
        {
          icon: HelpOutline,
          label: tAuth("forgotPassword.label"),
          to: "/forgot-password",
        },
        {
          icon: LockReset,
          label: tAuth("resetPassword.label"),
          to: "/reset-password",
        },
        {
          icon: DeleteForever,
          label: tAuth("deleteAccount.label"),
          to: "/delete-account",
        },
        {
          icon: ReceiptLong,
          label: tAuth("orders.label"),
          to: "/orders",
        },
        {
          icon: ConfirmationNumber,
          label: tAuth("coupons.label"),
          to: "/coupons",
        },
        {
          children: [
            {
              icon: Stars,
              label: tAuth("points.transactions.label"),
              to: "/transactions",
            },
            {
              icon: Storefront,
              label: tAuth("store.label"),
              to: "/store",
            },
          ],
          disabled: true,
          icon: Stars,
          label: tAuth("points.label"),
          to: "/points",
        },
        {
          children: [
            {
              icon: Person,
              label: tAuth("settings.account.label"),
              to: "/account",
            },
            {
              icon: Lock,
              label: tAuth("settings.security.label"),
              to: "/security",
            },
          ],
          disabled: true,
          icon: Settings,
          label: tAuth("settings.label"),
          to: "/settings",
        },
      ],
      disabled: true,
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
          icon: Gavel,
          label: tCompany("legal.terms.label"),
          to: "/terms",
        },
        {
          icon: Policy,
          label: tCompany("legal.privacy.label"),
          to: "/privacy",
        },
      ],
      disabled: true,
      icon: Business,
      label: tCompany("label"),
      to: "/company",
    },
    {
      children: orderChildren,
      disabled: true,
      icon: ShoppingCart,
      label: tOrder("label"),
      to: "/order",
    },
    {
      icon: ReceiptLong,
      label: tOrders("label"),
      to: `/orders?${menusQuery}`,
    },
    {
      icon: ConfirmationNumber,
      label: tCoupons("label"),
      to: "/coupons",
    },
    {
      children: [
        {
          children: [
            {
              icon: People,
              label: tOrganizations("members.label"),
              to: "/members",
            },
            {
              children: [
                {
                  disabled: true,
                  icon: Group,
                  label: teamName,
                  to: `/${teamId}`,
                },
              ],
              icon: Groups,
              label: tOrganizations("teams.label"),
              to: "/teams",
            },
            {
              icon: Mail,
              label: tOrganizations("invitations.label"),
              to: "/invitations",
            },
            {
              icon: LocationOn,
              label: tOrganizations("location.label"),
              to: "/location",
            },
          ],
          disabled: true,
          icon: ManageAccounts,
          label: organizationSlugName,
          to: `/${slug}`,
        },
      ],
      icon: Business,
      label: tOrganizations("label"),
      to: "/organizations",
    },
  ];
};

const findBreadcrumb = (
  breadcrumbs: BreadcrumbItem[],
  targetPath: string,
  parentPath = "",
):
  | Pick<BreadcrumbItem, "disabled" | "hidden" | "icon" | "label" | "to">
  | undefined =>
  breadcrumbs.flatMap(({ children, disabled, hidden, icon, label, to }) => {
    const currentPath = `${parentPath}${to.split("?")[0]}`;

    if (currentPath === targetPath)
      return [{ disabled, hidden, icon, label, to }];

    if (children) {
      const found = findBreadcrumb(children, targetPath, currentPath);
      if (!found) return [];

      return [found];
    }

    return [];
  })[0];

const findHiddenTo = (
  startIndex: number,
  pathnames: string[],
  breadcrumbs: BreadcrumbItem[],
): string | undefined => {
  const nextIndex = startIndex + 1;
  if (nextIndex >= pathnames.length) return;

  const nextMatchPath = `/${pathnames.slice(0, nextIndex + 1).join("/")}`;
  const { hidden = false } = findBreadcrumb(breadcrumbs, nextMatchPath) || {};
  if (!hidden) return;

  return findHiddenTo(nextIndex, pathnames, breadcrumbs);
};

const ITEMS_BEFORE_COLLAPSE = 1;
const ITEMS_AFTER_COLLAPSE = 2;
const MAX_ITEMS = ITEMS_BEFORE_COLLAPSE + ITEMS_AFTER_COLLAPSE + 1;

interface RouterBreadcrumbsProps {
  organizationName: string;
}

const RouterBreadcrumbs = ({ organizationName }: RouterBreadcrumbsProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const breadcrumbs = useBreadcrumbs(organizationName);

  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  const segments: BreadcrumbItem[] = pathnames.flatMap((value, index) => {
    const segmentPath = pathnames.slice(0, index + 1).join("/");
    const path = `/${segmentPath}`;

    const found = findBreadcrumb(breadcrumbs, path);
    const {
      disabled = false,
      hidden = false,
      icon = () => null,
      label = value,
      to: breadcrumbTo,
    } = found || {};
    if (hidden) return [];

    const hiddenTo = findHiddenTo(index, pathnames, breadcrumbs);
    const queryString = breadcrumbTo?.includes("?")
      ? breadcrumbTo.split("?")[1]
      : undefined;
    const to = queryString ? `${path}?${queryString}` : hiddenTo || path;

    return [{ disabled, icon, label, to }];
  });

  const lastSegment = segments.at(-1);
  const isCollapsed = segments.length > MAX_ITEMS;
  const afterStart = segments.length - ITEMS_AFTER_COLLAPSE;
  const collapsedItems = segments.slice(ITEMS_BEFORE_COLLAPSE, afterStart);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement> | null) => {
    if (event) setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const renderSegment = (segment: BreadcrumbItem) => {
    const { disabled, icon: Icon, label, to } = segment;
    const isLast = segment === lastSegment;
    const isText = isLast || disabled;
    const color = isLast ? "text.primary" : "text.secondary";

    return isText ? (
      <StyledTypography color={color} key={to}>
        <Icon fontSize="inherit" />
        {label}
      </StyledTypography>
    ) : (
      <StyledLink
        color="text.secondary"
        component={Link}
        href={to}
        key={to}
        underline="always"
      >
        <Icon fontSize="inherit" />
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
          {collapsedItems.map(({ disabled, icon: Icon, label, to }) => (
            <StyledMenuItem
              disabled={disabled}
              key={to}
              onClick={handleClose}
              {...(disabled ? {} : { component: Link, href: to })}
            >
              <Icon fontSize="inherit" />
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
