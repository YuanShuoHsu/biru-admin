// https://mui.com/material-ui/react-breadcrumbs/#system-IconBreadcrumbs.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-RouterBreadcrumbs.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { ORDER_MODE } from "@/constants/orderMode";

import { usePathname } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  AccountCircle,
  AdminPanelSettings,
  Business,
  Dashboard,
  DeleteForever,
  Devices,
  Email,
  Extension,
  Fastfood,
  Gavel,
  Group,
  Groups,
  HelpOutline,
  Info,
  LocalOffer,
  LocationOn,
  Lock,
  LockReset,
  Login,
  Mail,
  ManageAccounts,
  MenuBook,
  Payment,
  People,
  Person,
  PersonAdd,
  Pets,
  Policy,
  Settings,
  ShoppingCart,
  Storefront,
  Tune,
  ViewList,
} from "@mui/icons-material";
import {
  Breadcrumbs,
  Link,
  type SvgIconProps,
  Typography,
} from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";

import type { MenuSection, ModifierGroup } from "@/types/menus";
import type { RouteParams } from "@/types/routeParams";

import { fetcher } from "@/utils/fetcher";
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

const iconTextBaseStyles = (theme: Theme) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
});

const StyledTypography = styled(Typography)(({ theme }) => ({
  ...iconTextBaseStyles(theme),
}));

const StyledLink = styled(Link)(({ theme }) => ({
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
  const tDashboard = useTranslations("dashboard");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tOrganizations = useTranslations("organizations");

  const isPickup = mode === ORDER_MODE.Pickup;

  const modeLabel =
    mode === ORDER_MODE.Pickup
      ? tOrder("mode.pickup.label")
      : mode === ORDER_MODE.DineIn
        ? tOrder("mode.dineIn.label")
        : mode || "";

  const storeChildren: BreadcrumbItem[] = [
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
      icon: ShoppingCart,
      label: modeLabel,
      to: `/${mode}`,
      children: [
        {
          children: storeChildren,
          disabled: !isPickup,
          icon: Storefront,
          label: organizationName,
          to: `/${organizationSlug}`,
        },
      ],
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
                      label: tMenus("offers.label"),
                      to: "/offers",
                    },
                    {
                      icon: Extension,
                      label: tMenus("addOns.label"),
                      to: "/add-ons",
                    },
                  ],
                  hidden: true,
                  icon: Fastfood,
                  to: `/${menuItemId}`,
                },
              ],
              icon: ViewList,
              label: menuSectionName,
              to: `/${menuSectionId}?${menusQuery}`,
            },
          ],
          icon: ViewList,
          label: tMenus("sections.label"),
          to: `/sections?${menusQuery}`,
        },
        {
          children: [
            {
              icon: Tune,
              label: modifierGroupName,
              to: `/${groupId}`,
            },
          ],
          icon: Tune,
          label: tMenus("modifierGroups.label"),
          to: `/modifier-groups?${menusQuery}`,
        },
      ],
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
    const pathOnly = to.split("?")[0];
    const currentPath = `${parentPath}${pathOnly}`;

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

interface RouterBreadcrumbsProps {
  organizationName: string;
}

const RouterBreadcrumbs = ({ organizationName }: RouterBreadcrumbsProps) => {
  const breadcrumbs = useBreadcrumbs(organizationName);

  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  const segments = pathnames.flatMap((value, index) => {
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

  const lastIndex = segments.length - 1;

  return (
    <StyledBreadcrumbs aria-label="breadcrumb">
      {segments.map(({ disabled, icon: Icon, label, to }, index) => {
        const isLast = index === lastIndex;
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
            href={to}
            key={to}
            underline="always"
          >
            <Icon fontSize="inherit" />
            {label}
          </StyledLink>
        );
      })}
    </StyledBreadcrumbs>
  );
};

export default RouterBreadcrumbs;
