"use client";

import {
  type MessageKeys,
  type Messages,
  type NestedKeyOf,
  useTranslations,
} from "next-intl";
import { useSearchParams } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";
import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

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

import type { NavItem } from "@/types/navItem";

import { getHref } from "@/utils/href";

type LabelKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

type RouteQuery =
  | "organization"
  | "page"
  | "pageSize"
  | "partySize"
  | "range"
  | "tableNumber";

interface RouteMeta {
  children?: Record<string, RouteMeta>;
  disabled?: true;
  icon: React.ComponentType<SvgIconProps>;
  label?: LabelKey;
  query?: readonly RouteQuery[];
  to?: string;
}

interface MatchedRoute extends RouteMeta {
  param?: string;
}

const orderModeChildren: Record<string, RouteMeta> = {
  "[organizationSlug]": {
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
    query: ["partySize", "tableNumber"],
  },
};

const routes: Record<string, RouteMeta> = {
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
        disabled: true,
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
        disabled: true,
        icon: Settings,
        label: "auth.settings.label",
        to: "/auth/settings/account",
      },
      "sign-in": { icon: Login, label: "auth.signIn.label" },
      "sign-up": { icon: PersonAdd, label: "auth.signUp.label" },
      "verify-email": { icon: Email, label: "auth.verifyEmail.label" },
    },
    disabled: true,
    icon: AccountCircle,
    label: "auth.label",
  },
  banners: {
    icon: ViewCarousel,
    label: "banners.label",
    query: ["page", "pageSize"],
  },
  company: {
    children: {
      about: { icon: Info, label: "company.about.label" },
      privacy: { icon: Policy, label: "company.legal.privacy.label" },
      terms: { icon: Gavel, label: "company.legal.terms.label" },
    },
    disabled: true,
    icon: Apartment,
    label: "company.label",
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
                disabled: true,
                icon: Fastfood,
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
    disabled: true,
    icon: MenuBook,
    label: "menus.label",
    to: "/menus/sections",
  },

  order: {
    children: {
      [ORDER_MODE.Counter]: {
        children: orderModeChildren,
        disabled: true,
        icon: QrCodeScanner,
        label: "order.mode.counter.label",
      },
      [ORDER_MODE.DineIn]: {
        children: orderModeChildren,
        disabled: true,
        icon: Restaurant,
        label: "order.mode.dineIn.label",
      },
      [ORDER_MODE.Kiosk]: {
        children: orderModeChildren,
        disabled: true,
        icon: TouchApp,
        label: "order.mode.kiosk.label",
      },
      [ORDER_MODE.Pickup]: {
        children: orderModeChildren,
        icon: LocalMall,
        label: "order.mode.pickup.label",
      },
    },
    disabled: true,
    icon: ShoppingCart,
    label: "order.label",
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
    disabled: true,
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
        disabled: true,
        icon: ManageAccounts,
      },
    },
    icon: Business,
    label: "organizations.label",
  },
};

export const findRoute = (path: string): MatchedRoute | undefined => {
  let children: RouteMeta["children"] = routes;
  let matched: MatchedRoute | undefined;

  for (const segment of path.split("/").filter(Boolean)) {
    if (!children) return;

    const key: string | undefined =
      segment in children
        ? segment
        : Object.keys(children).find((child) => child.startsWith("["));
    const meta: RouteMeta | undefined = key ? children[key] : undefined;
    if (!key || !meta) return;

    matched = {
      ...meta,
      ...(key.startsWith("[") && { param: key.slice(1, -1) }),
    };
    children = meta.children;
  }

  return matched;
};

export const useRoutes = (defaultOrganization?: string | null) => {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const values: Record<RouteQuery, string | null> = {
    organization:
      searchParams.get("organization") || defaultOrganization || null,
    page: DEFAULT_PAGINATION_QUERY.page,
    pageSize: DEFAULT_PAGINATION_QUERY.pageSize,
    partySize: searchParams.get("partySize"),
    range: searchParams.get("range"),
    tableNumber: searchParams.get("tableNumber"),
  };

  const buildHref = (href: string) => {
    const { query } = findRoute(href) || {};
    if (!query) return href;

    return getHref(
      href,
      Object.fromEntries(query.map((key) => [key, values[key]])),
    );
  };

  return (path: string, href?: string): NavItem & { to: string } => {
    const { icon, label, to } = findRoute(path) || {};

    return {
      icon,
      label: label && t(label),
      to: buildHref(href ?? to ?? path),
    };
  };
};
