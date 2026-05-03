// https://mui.com/material-ui/react-breadcrumbs/#system-IconBreadcrumbs.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-RouterBreadcrumbs.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { ORDER_MODE } from "@/constants/orderMode";

import { useOrganization } from "@/hooks/useOrganization";

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
  Gavel,
  Group,
  Groups,
  HelpOutline,
  Info,
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
} from "@mui/icons-material";
import {
  Breadcrumbs,
  Link,
  type SvgIconProps,
  Typography,
} from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";

import type { RouteParams } from "@/types/routeParams";

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
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
  label: string;
  to: string;
}

const useBreadcrumbs = (): BreadcrumbItem[] => {
  const { menuId, slug, storeSlug, teamId, userId } = useParams<RouteParams>();

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const organization = useOrganization();
  const storeName = organization?.name || "";

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
  const { data: organizationName = "" } = useSWR(
    slug ? `organization-${slug}` : null,
    async () => {
      const { data } = await authClient.organization.list();

      return data?.find(({ slug }) => slug === decodedSlug)?.name;
    },
  );

  const { data: teamName = "" } = useSWR(
    teamId ? `team-${teamId}` : null,
    async () => {
      const { data } = await authClient.organization.getFullOrganization({
        query: { organizationSlug: decodedSlug },
      });

      return data?.teams.find(({ id }) => id === teamId)?.name;
    },
  );

  const { data: menuName = "" } = useSWR(
    menuId ? `/api/menus/${menuId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return "";
      const menu = await res.json();
      return menu?.name ?? "";
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
      children: storeChildren,
      disabled: !isPickup,
      icon: Storefront,
      label: storeName,
      to: `/${storeSlug}`,
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
          ],
          disabled: true,
          icon: ManageAccounts,
          label: organizationName,
          to: `/${slug}`,
        },
      ],
      icon: Business,
      label: tOrganizations("label"),
      to: "/organizations",
    },
    {
      children: [
        {
          disabled: true,
          icon: MenuBook,
          label: menuName,
          to: `/${menuId}`,
        },
      ],
      icon: MenuBook,
      label: tMenus("label"),
      to: "/menus",
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
  ];
};

const findBreadcrumb = (
  breadcrumbs: BreadcrumbItem[],
  targetPath: string,
  parentPath = "",
): Pick<BreadcrumbItem, "disabled" | "hidden" | "icon" | "label"> | undefined =>
  breadcrumbs.flatMap(({ children, disabled, hidden, icon, label, to }) => {
    const currentPath = `${parentPath}${to}`;

    if (currentPath === targetPath) return [{ disabled, hidden, icon, label }];

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

  const nextTo = findHiddenTo(nextIndex, pathnames, breadcrumbs);
  if (!nextTo) return nextMatchPath;

  return nextTo;
};

const RouterBreadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs();

  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  const segments = pathnames.flatMap((value, index) => {
    const segmentPath = pathnames.slice(0, index + 1).join("/");
    const matchPath = `/${segmentPath}`;
    const baseTo = `/${segmentPath}`;

    const {
      disabled = false,
      hidden = false,
      icon = () => null,
      label = value,
    } = findBreadcrumb(breadcrumbs, matchPath) || {};
    if (hidden) return [];

    const hiddenTo = findHiddenTo(index, pathnames, breadcrumbs);
    const to = hiddenTo || baseTo;

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
