"use client";

import {
  type MessageKeys,
  type Messages,
  type NestedKeyOf,
  useLocale,
  useTranslations,
} from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";

import DividerSlot from "@/components/TemporaryDrawer/NestedList/DividerSlot";
import OrderModeMenuItem from "@/components/TemporaryDrawer/NestedList/OrderModeMenuItem";

import { ORDER_MODE } from "@/constants/orderMode";
import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { useDefaultOrganization, useOrganization } from "@/hooks/organizations";

import { usePathname } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  AccountCircle,
  AdminPanelSettings,
  Apartment,
  Assignment,
  Business,
  Category,
  Checklist,
  ConfirmationNumber,
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
  ListAlt,
  LocalMall,
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
  QrCodeScanner,
  ReceiptLong,
  Restaurant,
  Settings,
  ShoppingCart,
  Stars,
  Storefront,
  TouchApp,
  Tune,
  ViewCarousel,
  ViewKanban,
} from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material";

import type { MenuItem, MenuSection, ModifierGroup } from "@/types/menus";
import type { NavItem, Slot } from "@/types/navItem";
import type { RouteParams } from "@/types/routeParams";

import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { localize } from "@/utils/locale";

type LabelKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

type RouteQuery =
  | "back"
  | "organization"
  | "page"
  | "pageSize"
  | "partySize"
  | "range"
  | "redirectTo"
  | "tableNumber"
  | "type";

interface RouteSlot {
  slot: Slot;
}

interface RoutePath {
  children?: Record<string, Route>;
  icon: React.ComponentType<SvgIconProps>;
  label?: LabelKey;
  query?: readonly RouteQuery[];
  to?: string | null;
}

type Route = RoutePath | RouteSlot;

const storeRoute: RoutePath = {
  children: {
    cart: {
      icon: ShoppingCart,
      label: "order.mode.storeSlug.tableNumber.stepper.cart.label",
    },
    checkout: {
      icon: Payment,
      label: "order.mode.storeSlug.tableNumber.stepper.checkout.label",
    },
    complete: {
      icon: Pets,
      label: "order.mode.storeSlug.tableNumber.stepper.complete.label",
    },
  },
  icon: Storefront,
  query: ["partySize", "tableNumber", "type"],
};

const orderModeChildren: Record<string, Route> = {
  "[organizationSlug]": storeRoute,
};

const onSiteOrderModeChildren: Record<string, Route> = {
  "current-store": { slot: OrderModeMenuItem },
  "[organizationSlug]": storeRoute,
};

const routes: Record<string, Route> = {
  admins: {
    children: { "[userId]": { icon: Devices } },
    icon: AdminPanelSettings,
    label: "admins.label",
    query: ["page", "pageSize"],
  },
  auth: {
    children: {
      coupons: { icon: ConfirmationNumber, label: "auth.coupons.label" },
      "delete-account": {
        icon: DeleteForever,
        label: "auth.deleteAccount.label",
      },
      "forgot-password": {
        icon: HelpOutline,
        label: "auth.forgotPassword.label",
      },
      orders: {
        icon: ReceiptLong,
        label: "auth.orders.label",
        query: ["page", "pageSize"],
      },
      points: {
        children: {
          store: { icon: Storefront, label: "auth.store.label" },
          transactions: {
            icon: Stars,
            label: "auth.points.transactions.label",
            query: ["page", "pageSize"],
          },
        },
        icon: Stars,
        label: "auth.points.label",
        to: "/auth/points/transactions",
      },
      "reset-password": {
        icon: LockReset,
        label: "auth.resetPassword.label",
      },
      settings: {
        children: {
          account: { icon: Person, label: "auth.settings.account.label" },
          security: { icon: Lock, label: "auth.settings.security.label" },
        },
        icon: Settings,
        label: "auth.settings.label",
        to: "/auth/settings/account",
      },
      "sign-in": {
        icon: Login,
        label: "auth.signIn.label",
        query: ["redirectTo"],
      },
      "sign-up": {
        icon: PersonAdd,
        label: "auth.signUp.label",
        query: ["redirectTo"],
      },
      "verify-email": { icon: Email, label: "auth.verifyEmail.label" },
    },
    icon: AccountCircle,
    label: "auth.label",
    to: null,
  },
  banners: {
    icon: ViewCarousel,
    label: "banners.label",
    query: ["page", "pageSize"],
  },
  company: {
    children: {
      about: { icon: Info, label: "company.about.label" },
      privacy: {
        icon: Policy,
        label: "company.legal.privacy.label",
        query: ["back", "redirectTo"],
      },
      terms: {
        icon: Gavel,
        label: "company.legal.terms.label",
        query: ["back", "redirectTo"],
      },
    },
    icon: Apartment,
    label: "company.label",
    to: null,
  },
  coupons: {
    icon: ConfirmationNumber,
    label: "coupons.label",
    query: ["page", "pageSize"],
  },
  dashboard: {
    icon: Dashboard,
    label: "dashboard.label",
    query: ["organization", "range"],
  },
  divider: { slot: DividerSlot },
  menus: {
    children: {
      "modifier-groups": {
        children: { "[groupId]": { icon: Checklist } },
        icon: Tune,
        label: "menus.modifierGroups.label",
        query: ["organization", "page", "pageSize"],
      },
      sections: {
        children: {
          "[menuSectionId]": {
            children: {
              "[menuItemId]": {
                children: {
                  "add-ons": {
                    icon: Extension,
                    label: "menus.items.addOns.label",
                  },
                  "modifier-groups": {
                    icon: Tune,
                    label: "menus.items.modifierGroups.label",
                  },
                },
                icon: Fastfood,
                to: null,
              },
            },
            icon: ListAlt,
            query: ["organization", "page", "pageSize"],
          },
        },
        icon: Category,
        label: "menus.sections.label",
        query: ["organization", "page", "pageSize"],
      },
    },
    icon: MenuBook,
    label: "menus.label",
    to: "/menus/sections",
  },
  order: {
    children: {
      [ORDER_MODE.Counter]: {
        children: onSiteOrderModeChildren,
        icon: QrCodeScanner,
        label: "order.mode.counter.label",
        to: null,
      },
      [ORDER_MODE.DineIn]: {
        children: onSiteOrderModeChildren,
        icon: Restaurant,
        label: "order.mode.dineIn.label",
        to: null,
      },
      [ORDER_MODE.Kiosk]: {
        children: onSiteOrderModeChildren,
        icon: TouchApp,
        label: "order.mode.kiosk.label",
        to: null,
      },
      [ORDER_MODE.Pickup]: {
        children: orderModeChildren,
        icon: LocalMall,
        label: "order.mode.pickup.label",
      },
    },
    icon: ShoppingCart,
    label: "order.label",
    to: null,
  },
  orders: {
    children: {
      board: {
        icon: ViewKanban,
        label: "orders.board.title",
        query: ["organization"],
      },
      list: {
        icon: ReceiptLong,
        label: "orders.list.label",
        query: ["organization", "page", "pageSize"],
      },
    },
    icon: Assignment,
    label: "orders.label",
    to: "/orders/list",
  },
  organizations: {
    children: {
      "[slug]": {
        children: {
          invitations: {
            icon: Mail,
            label: "organizations.invitations.label",
          },
          location: {
            icon: LocationOn,
            label: "organizations.location.label",
          },
          members: { icon: People, label: "organizations.members.label" },
          points: { icon: Stars, label: "organizations.points.label" },
          teams: {
            children: { "[teamId]": { icon: Group } },
            icon: Groups,
            label: "organizations.teams.label",
          },
        },
        icon: ManageAccounts,
        to: null,
      },
    },
    icon: Business,
    label: "organizations.label",
  },
};

const findRoute = (path: string) => {
  let children: RoutePath["children"] = routes;
  let matched: (Route & { param?: string }) | undefined;

  for (const segment of path.split("/").filter(Boolean)) {
    if (!children) return;

    const key: string | undefined =
      segment in children
        ? segment
        : Object.keys(children).find((child) => child.startsWith("["));
    const meta: Route | undefined = key ? children[key] : undefined;
    if (!key || !meta) return;

    matched = {
      ...meta,
      ...(key.startsWith("[") && { param: key.slice(1, -1) }),
    };
    children = "slot" in meta ? undefined : meta.children;
  }

  return matched;
};

const findRoutePath = (path: string) => {
  const route = findRoute(path);

  return route && !("slot" in route) ? route : undefined;
};

const useDynamicLabels = (): Partial<Record<string, string>> => {
  const locale = useLocale();

  const organization = useOrganization();

  const { groupId, menuItemId, menuSectionId, slug, teamId, userId } =
    useParams<RouteParams>();

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

  return {
    groupId: modifierGroupName,
    menuItemId: menuItemName,
    menuSectionId: menuSectionName,
    organizationSlug: organization?.name || "",
    slug: organizationSlugName,
    teamId: teamName,
    userId: userEmail,
  };
};

export const useRoutes = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const labels = useDynamicLabels();

  const pathname = usePathname();
  const defaultOrganization = useDefaultOrganization() || null;

  const values: Record<RouteQuery, string | null> = {
    back: pathname,
    organization: searchParams.get("organization") || defaultOrganization,
    page: DEFAULT_PAGINATION_QUERY.page,
    pageSize: DEFAULT_PAGINATION_QUERY.pageSize,
    partySize: searchParams.get("partySize"),
    range: searchParams.get("range"),
    redirectTo: searchParams.get("redirectTo") || pathname,
    tableNumber: searchParams.get("tableNumber"),
    type: searchParams.get("type"),
  };

  const buildHref = (href: string, query = findRoutePath(href)?.query) => {
    if (!query) return href;

    return getHref(
      href,
      Object.fromEntries(query.map((key) => [key, values[key]])),
    );
  };

  return (path: string, href?: string): NavItem => {
    const route = findRoute(path);

    if (route && "slot" in route) return { slot: route.slot };

    const { icon, label, param, query, to } = route ?? {};
    const target = to === null ? undefined : (href ?? to ?? path);

    return {
      icon,
      label:
        (param && labels[param]) ??
        (label && t(label)) ??
        path.split("/").at(-1),
      path,
      to: target && buildHref(target, target === path ? query : undefined),
    };
  };
};
