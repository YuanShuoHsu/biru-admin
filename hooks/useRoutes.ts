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

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { useDefaultOrganization } from "@/hooks/organizations";

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
  EventAvailable,
  Extension,
  Fastfood,
  Gavel,
  Group,
  Groups,
  HelpOutline,
  History,
  Info,
  Kitchen,
  ListAlt,
  LocationOn,
  Lock,
  LockReset,
  LocalShipping,
  Login,
  Mail,
  ManageAccounts,
  ManageSearch,
  MenuBook,
  People,
  Person,
  PersonAdd,
  Policy,
  ReceiptLong,
  Settings,
  SoupKitchen,
  Stars,
  Storefront,
  SwapVert,
  Tune,
  ViewCarousel,
  ViewKanban,
} from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material";

import type { Coupon } from "@/types/coupons";
import type { Ingredient, Recipe, Supplier } from "@/types/inventory";
import type { MenuItem, MenuSection, ModifierGroup } from "@/types/menus";
import type { NavItem } from "@/types/navItem";
import type { AdminOrderResponse } from "@/types/orders";
import type { RouteParams } from "@/types/routeParams";

import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { localize } from "@/utils/locale";

type MessageKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

type RouteQuery =
  | "back"
  | "organization"
  | "page"
  | "pageSize"
  | "range"
  | "redirectTo";

interface Route {
  children?: Route[];
  icon: React.ComponentType<SvgIconProps>;
  label?: MessageKey;
  query?: readonly RouteQuery[];
  segment: string;
  to?: string | null;
}

const routes: Route[] = [
  {
    icon: Dashboard,
    label: "dashboard.label",
    query: ["organization", "range"],
    segment: "dashboard",
  },
  {
    children: [
      {
        icon: ViewKanban,
        label: "orders.board.title",
        query: ["organization"],
        segment: "board",
      },
      {
        children: [
          {
            children: [
              {
                icon: History,
                label: "audit.title",
                query: ["organization", "page", "pageSize"],
                segment: "audit-logs",
              },
            ],
            icon: ReceiptLong,
            segment: "[orderId]",
            to: null,
          },
        ],
        icon: ReceiptLong,
        label: "orders.list.label",
        query: ["organization", "page", "pageSize"],
        segment: "list",
      },
    ],
    icon: Assignment,
    label: "orders.label",
    segment: "orders",
    to: "/orders/list",
  },
  {
    children: [
      {
        icon: History,
        label: "audit.title",
        query: ["organization", "page", "pageSize"],
        segment: "audit-logs",
      },
      {
        children: [
          {
            children: [
              {
                icon: History,
                label: "audit.title",
                query: ["organization", "page", "pageSize"],
                segment: "audit-logs",
              },
              {
                children: [
                  {
                    icon: History,
                    label: "audit.title",
                    query: ["organization", "page", "pageSize"],
                    segment: "audit-logs",
                  },
                ],
                icon: Checklist,
                label: "menus.modifiers.label",
                segment: "[modifierId]",
                to: null,
              },
            ],
            icon: Checklist,
            segment: "[groupId]",
          },
        ],
        icon: Tune,
        label: "menus.modifierGroups.label",
        query: ["organization", "page", "pageSize"],
        segment: "modifier-groups",
      },
      {
        children: [
          {
            children: [
              {
                icon: History,
                label: "audit.title",
                query: ["organization", "page", "pageSize"],
                segment: "audit-logs",
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            icon: History,
                            label: "audit.title",
                            query: ["organization", "page", "pageSize"],
                            segment: "audit-logs",
                          },
                        ],
                        icon: Extension,
                        label: "menus.items.addOns.label",
                        segment: "[addOnId]",
                        to: null,
                      },
                    ],
                    icon: Extension,
                    label: "menus.items.addOns.label",
                    segment: "add-ons",
                  },
                  {
                    icon: History,
                    label: "audit.title",
                    query: ["organization", "page", "pageSize"],
                    segment: "audit-logs",
                  },
                  {
                    icon: Kitchen,
                    label: "inventory.recipes.ingredients.label",
                    query: ["organization"],
                    segment: "ingredients",
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            icon: History,
                            label: "audit.title",
                            query: ["organization", "page", "pageSize"],
                            segment: "audit-logs",
                          },
                        ],
                        icon: Tune,
                        label: "menus.items.modifierGroups.label",
                        segment: "[linkId]",
                        to: null,
                      },
                    ],
                    icon: Tune,
                    label: "menus.items.modifierGroups.label",
                    segment: "modifier-groups",
                  },
                ],
                icon: Fastfood,
                segment: "[menuItemId]",
                to: null,
              },
            ],
            icon: ListAlt,
            query: ["organization", "page", "pageSize"],
            segment: "[menuSectionId]",
          },
        ],
        icon: Category,
        label: "menus.sections.label",
        query: ["organization", "page", "pageSize"],
        segment: "sections",
      },
    ],
    icon: MenuBook,
    label: "menus.label",
    segment: "menus",
    to: "/menus/sections",
  },
  {
    children: [
      {
        children: [
          {
            icon: History,
            label: "audit.title",
            query: ["organization", "page", "pageSize"],
            segment: "audit-logs",
          },
          {
            icon: SwapVert,
            label: "inventory.transactions.label",
            query: ["organization", "page", "pageSize"],
            segment: "transactions",
          },
        ],
        icon: Kitchen,
        segment: "[ingredientId]",
        to: null,
      },
    ],
    icon: Kitchen,
    label: "inventory.ingredients.label",
    query: ["organization", "page", "pageSize"],
    segment: "ingredients",
  },
  {
    children: [
      {
        children: [
          {
            icon: History,
            label: "audit.title",
            query: ["organization", "page", "pageSize"],
            segment: "audit-logs",
          },
        ],
        icon: SoupKitchen,
        segment: "[recipeId]",
        to: null,
      },
    ],
    icon: SoupKitchen,
    label: "inventory.recipes.label",
    segment: "recipes",
    to: null,
  },
  {
    children: [
      {
        children: [
          {
            icon: History,
            label: "audit.title",
            query: ["organization", "page", "pageSize"],
            segment: "audit-logs",
          },
        ],
        icon: LocalShipping,
        segment: "[supplierId]",
        to: null,
      },
    ],
    icon: LocalShipping,
    label: "inventory.suppliers.label",
    query: ["organization", "page", "pageSize"],
    segment: "suppliers",
  },
  {
    icon: History,
    label: "audit.title",
    query: ["organization", "page", "pageSize"],
    segment: "audit-logs",
  },
  {
    children: [
      {
        children: [
          {
            icon: Mail,
            label: "organizations.invitations.label",
            segment: "invitations",
          },
          {
            icon: LocationOn,
            label: "organizations.location.label",
            segment: "location",
          },
          {
            icon: People,
            label: "organizations.members.label",
            segment: "members",
          },
          {
            icon: EventAvailable,
            label: "organizations.pickup.label",
            segment: "pickup",
          },
          {
            icon: Stars,
            label: "organizations.points.label",
            segment: "points",
          },
          {
            children: [{ icon: Group, segment: "[teamId]" }],
            icon: Groups,
            label: "organizations.teams.label",
            segment: "teams",
          },
        ],
        icon: ManageAccounts,
        segment: "[slug]",
        to: null,
      },
    ],
    icon: Business,
    label: "organizations.label",
    segment: "organizations",
  },
  {
    children: [
      {
        children: [
          {
            icon: History,
            label: "audit.title",
            query: ["organization", "page", "pageSize"],
            segment: "audit-logs",
          },
        ],
        icon: ManageSearch,
        query: ["page", "pageSize"],
        segment: "[couponId]",
      },
    ],
    icon: ConfirmationNumber,
    label: "coupons.label",
    query: ["organization", "page", "pageSize"],
    segment: "coupons",
  },
  {
    children: [
      {
        children: [
          {
            icon: History,
            label: "audit.title",
            query: ["page", "pageSize"],
            segment: "audit-logs",
          },
        ],
        icon: ViewCarousel,
        segment: "[bannerId]",
        to: null,
      },
    ],
    icon: ViewCarousel,
    label: "banners.label",
    query: ["page", "pageSize"],
    segment: "banners",
  },
  {
    children: [{ icon: Devices, segment: "[userId]" }],
    icon: AdminPanelSettings,
    label: "admins.label",
    query: ["page", "pageSize"],
    segment: "admins",
  },
  {
    children: [
      {
        icon: ConfirmationNumber,
        label: "auth.coupons.label",
        segment: "coupons",
      },
      {
        icon: DeleteForever,
        label: "auth.deleteAccount.label",
        segment: "delete-account",
      },
      {
        icon: HelpOutline,
        label: "auth.forgotPassword.label",
        segment: "forgot-password",
      },
      {
        icon: ReceiptLong,
        label: "auth.orders.label",
        query: ["page", "pageSize"],
        segment: "orders",
      },
      {
        children: [
          { icon: Storefront, label: "auth.store.label", segment: "store" },
          {
            icon: Stars,
            label: "auth.points.transactions.label",
            query: ["page", "pageSize"],
            segment: "transactions",
          },
        ],
        icon: Stars,
        label: "auth.points.label",
        segment: "points",
        to: "/auth/points/transactions",
      },
      {
        icon: LockReset,
        label: "auth.resetPassword.label",
        segment: "reset-password",
      },
      {
        children: [
          {
            icon: Person,
            label: "auth.settings.account.label",
            segment: "account",
          },
          {
            icon: Lock,
            label: "auth.settings.security.label",
            segment: "security",
          },
        ],
        icon: Settings,
        label: "auth.settings.label",
        segment: "settings",
        to: "/auth/settings/account",
      },
      {
        icon: Login,
        label: "auth.signIn.label",
        query: ["redirectTo"],
        segment: "sign-in",
      },
      {
        icon: PersonAdd,
        label: "auth.signUp.label",
        query: ["redirectTo"],
        segment: "sign-up",
      },
      {
        icon: Email,
        label: "auth.verifyEmail.label",
        segment: "verify-email",
      },
    ],
    icon: AccountCircle,
    label: "auth.label",
    segment: "auth",
    to: null,
  },
  {
    children: [
      { icon: Info, label: "company.about.label", segment: "about" },
      {
        icon: Gavel,
        label: "company.legal.terms.label",
        query: ["back", "redirectTo"],
        segment: "terms",
      },
      {
        icon: Policy,
        label: "company.legal.privacy.label",
        query: ["back", "redirectTo"],
        segment: "privacy",
      },
    ],
    icon: Apartment,
    label: "company.label",
    segment: "company",
    to: null,
  },
];

const findRoute = (path: string) => {
  let children: Route["children"] = routes;
  let matched: (Route & { param?: string }) | undefined;

  for (const segment of path.split("/").filter(Boolean)) {
    if (!children) return;

    const meta: Route | undefined =
      children.find((page) => page.segment === segment) ??
      children.find((page) => page.segment.startsWith("["));
    if (!meta) return;

    matched = {
      ...meta,
      ...(meta.segment.startsWith("[") && {
        param: meta.segment.slice(1, -1),
      }),
    };
    children = meta.children;
  }

  return matched;
};

const useDynamicLabels = (): Partial<Record<string, string>> => {
  const locale = useLocale();

  const {
    couponId,
    groupId,
    ingredientId,
    menuItemId,
    menuSectionId,
    orderId,
    recipeId,
    slug,
    supplierId,
    teamId,
    userId,
  } = useParams<RouteParams>();

  const organizationQuery = useSearchParams().get("organization");

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

  const { data: ingredientName = "" } = useSWR(
    ingredientId ? `/api/ingredients/${ingredientId}` : null,
    async (url) => {
      try {
        const { name } = await fetcher<Ingredient>(url);

        return localize(name, locale);
      } catch {
        return "";
      }
    },
  );

  const { data: supplierName = "" } = useSWR(
    supplierId ? `/api/suppliers/${supplierId}` : null,
    async (url) => {
      try {
        const { name } = await fetcher<Supplier>(url);

        return name;
      } catch {
        return "";
      }
    },
  );

  const { data: recipeName = "" } = useSWR(
    recipeId ? `/api/recipes/${recipeId}` : null,
    async (url) => {
      try {
        const { name } = await fetcher<Recipe>(url);

        return localize(name, locale);
      } catch {
        return "";
      }
    },
  );

  const { data: couponCode = "" } = useSWR(
    couponId ? `/api/coupons/${couponId}` : null,
    async (url) => {
      try {
        const { code } = await fetcher<Coupon>(url);

        return code;
      } catch {
        return "";
      }
    },
  );

  const { data: orderNumber = "" } = useSWR(
    orderId && organizationQuery
      ? `/api/organizations/${organizationQuery}/orders/${orderId}`
      : null,
    async (url) => {
      try {
        const { orderNumber } = await fetcher<AdminOrderResponse>(url);

        return orderNumber;
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
    couponId: couponCode,
    groupId: modifierGroupName,
    ingredientId: ingredientName,
    menuItemId: menuItemName,
    menuSectionId: menuSectionName,
    orderId: orderNumber,
    recipeId: recipeName,
    slug: organizationSlugName,
    supplierId: supplierName,
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
    range: searchParams.get("range"),
    redirectTo: searchParams.get("redirectTo") || pathname,
  };

  const buildHref = (href: string, query = findRoute(href)?.query) => {
    if (!query) return href;

    return getHref(
      href,
      Object.fromEntries(query.map((key) => [key, values[key]])),
    );
  };

  return (path: string, href?: string): NavItem => {
    const { icon, label, param, query, to } = findRoute(path) ?? {};
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
