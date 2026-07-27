import type { MessageKeys, Messages, NestedKeyOf } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";

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

type LabelKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

export type RouteQuery =
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
  labelKey?: LabelKey;
  query?: readonly RouteQuery[];
}

interface MatchedRoute extends RouteMeta {
  param?: string;
}

const orderModeChildren: Record<string, RouteMeta> = {
  "[organizationSlug]": {
    children: {
      cart: {
        icon: ShoppingCart,
        labelKey: "order.mode.storeSlug.tableNumber.stepper.cart.label",
      },
      checkout: {
        icon: Payment,
        labelKey: "order.mode.storeSlug.tableNumber.stepper.checkout.label",
      },
      complete: {
        icon: Pets,
        labelKey: "order.mode.storeSlug.tableNumber.stepper.complete.label",
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
    labelKey: "admins.label",
    query: ["page", "pageSize"],
  },
  auth: {
    children: {
      coupons: { icon: ConfirmationNumber, labelKey: "auth.coupons.label" },
      "delete-account": {
        icon: DeleteForever,
        labelKey: "auth.deleteAccount.label",
      },
      "forgot-password": {
        icon: HelpOutline,
        labelKey: "auth.forgotPassword.label",
      },
      orders: {
        icon: ReceiptLong,
        labelKey: "auth.orders.label",
        query: ["page", "pageSize"],
      },
      points: {
        children: {
          store: { icon: Storefront, labelKey: "auth.store.label" },
          transactions: {
            icon: Stars,
            labelKey: "auth.points.transactions.label",
            query: ["page", "pageSize"],
          },
        },
        disabled: true,
        icon: Stars,
        labelKey: "auth.points.label",
      },
      "reset-password": {
        icon: LockReset,
        labelKey: "auth.resetPassword.label",
      },
      settings: {
        children: {
          account: { icon: Person, labelKey: "auth.settings.account.label" },
          security: { icon: Lock, labelKey: "auth.settings.security.label" },
        },
        disabled: true,
        icon: Settings,
        labelKey: "auth.settings.label",
      },
      "sign-in": { icon: Login, labelKey: "auth.signIn.label" },
      "sign-up": { icon: PersonAdd, labelKey: "auth.signUp.label" },
      "verify-email": { icon: Email, labelKey: "auth.verifyEmail.label" },
    },
    disabled: true,
    icon: AccountCircle,
    labelKey: "auth.label",
  },
  banners: {
    icon: ViewCarousel,
    labelKey: "banners.label",
    query: ["page", "pageSize"],
  },
  company: {
    children: {
      about: { icon: Info, labelKey: "company.about.label" },
      privacy: { icon: Policy, labelKey: "company.legal.privacy.label" },
      terms: { icon: Gavel, labelKey: "company.legal.terms.label" },
    },
    disabled: true,
    icon: Apartment,
    labelKey: "company.label",
  },
  coupons: {
    icon: ConfirmationNumber,
    labelKey: "coupons.label",
    query: ["page", "pageSize"],
  },
  dashboard: {
    icon: Dashboard,
    labelKey: "dashboard.label",
    query: ["organization", "range"],
  },
  menus: {
    children: {
      "modifier-groups": {
        children: { "[groupId]": { icon: Checklist } },
        icon: Tune,
        labelKey: "menus.modifierGroups.label",
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
                    labelKey: "menus.items.addOns.label",
                  },
                  "modifier-groups": {
                    icon: Tune,
                    labelKey: "menus.items.modifierGroups.label",
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
        labelKey: "menus.sections.label",
        query: ["organization", "page", "pageSize"],
      },
    },
    disabled: true,
    icon: MenuBook,
    labelKey: "menus.label",
  },

  order: {
    children: {
      [ORDER_MODE.Counter]: {
        children: orderModeChildren,
        disabled: true,
        icon: QrCodeScanner,
        labelKey: "order.mode.counter.label",
      },
      [ORDER_MODE.DineIn]: {
        children: orderModeChildren,
        disabled: true,
        icon: Restaurant,
        labelKey: "order.mode.dineIn.label",
      },
      [ORDER_MODE.Kiosk]: {
        children: orderModeChildren,
        disabled: true,
        icon: TouchApp,
        labelKey: "order.mode.kiosk.label",
      },
      [ORDER_MODE.Pickup]: {
        children: orderModeChildren,
        icon: LocalMall,
        labelKey: "order.mode.pickup.label",
      },
    },
    disabled: true,
    icon: ShoppingCart,
    labelKey: "order.label",
  },

  orders: {
    children: {
      board: {
        icon: ViewKanban,
        labelKey: "orders.board.title",
        query: ["organization"],
      },
      list: {
        icon: ReceiptLong,
        labelKey: "orders.list.label",
        query: ["organization", "page", "pageSize"],
      },
    },
    disabled: true,
    icon: Assignment,
    labelKey: "orders.label",
  },

  organizations: {
    children: {
      "[slug]": {
        children: {
          invitations: {
            icon: Mail,
            labelKey: "organizations.invitations.label",
          },
          location: {
            icon: LocationOn,
            labelKey: "organizations.location.label",
          },
          members: { icon: People, labelKey: "organizations.members.label" },
          points: { icon: Stars, labelKey: "organizations.points.label" },
          teams: {
            children: { "[teamId]": { icon: Group } },
            icon: Groups,
            labelKey: "organizations.teams.label",
          },
        },
        disabled: true,
        icon: ManageAccounts,
      },
    },
    icon: Business,
    labelKey: "organizations.label",
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
