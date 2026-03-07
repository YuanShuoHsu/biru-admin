// https://mui.com/material-ui/react-breadcrumbs/#system-IconBreadcrumbs.tsx
// https://mui.com/material-ui/react-breadcrumbs/#system-RouterBreadcrumbs.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { ORDER_MODE } from "@/constants/orderMode";

import { usePathname } from "@/i18n/navigation";

import {
  AccountCircle,
  Business,
  Email,
  Gavel,
  Group,
  HelpOutline,
  Info,
  LocalMall,
  LockReset,
  Login,
  Payment,
  Person,
  PersonAdd,
  Pets,
  Policy,
  Restaurant,
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
import type { Store } from "@/types/stores";

import { getStoreName } from "@/utils/stores";

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
  const { locale, mode, storeSlug } = useParams<RouteParams>();

  const { data: stores = [] } = useSWR<Store[]>("/api/stores");
  const storeName = getStoreName(locale, stores, storeSlug);

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCompany = useTranslations("company");
  const tOrder = useTranslations("order");

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

  const modeChildren: BreadcrumbItem[] = [
    {
      children: storeChildren,
      disabled: !isPickup,
      icon: Storefront,
      label: storeName,
      to: `/${storeSlug}`,
    },
  ];

  const orderChildren: BreadcrumbItem[] = [
    {
      children: modeChildren,
      disabled: !isPickup,
      icon: isPickup ? LocalMall : Restaurant,
      label: isPickup
        ? tOrder("mode.pickup.label")
        : tOrder("mode.dineIn.label"),
      to: `/${mode}`,
    },
  ];

  return [
    {
      children: [
        {
          icon: Group,
          label: tAccount("accountMenu.profile"),
          to: "/profile",
        },
        {
          icon: Person,
          label: tAccount("accountMenu.myAccount"),
          to: "/my-account",
        },
        {
          icon: PersonAdd,
          label: tAccount("accountMenu.addAnotherAccount"),
          to: "/add-another-account",
        },
        {
          icon: Settings,
          label: tAccount("accountSettings.label"),
          to: "/account-settings",
        },
      ],
      disabled: true,
      icon: AccountCircle,
      label: tAccount("label"),
      to: "/account",
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
