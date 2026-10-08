import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Dashboard from ".";
import { DASHBOARD_RANGES, resolveDashboardRange } from "./definitions";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { UserStatsResponse } from "@/types/admins";
import type { OrderMenu } from "@/types/menus";
import type { MenuItemSalesResponse, OrderStatsResponse } from "@/types/orders";
import type { OrganizationStats } from "@/types/organizations";
import type { WaitlistStats, WaitlistStatusResponse } from "@/types/waitlist";

import { getChangePercent } from "@/utils/dashboard";
import { fetcher } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string; range?: string }>;
}

export const generateMetadata = async ({
  params,
}: DashboardPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tDashboard = await getTranslations({ locale, namespace: "dashboard" });

  return { title: tDashboard("label") };
};

const DashboardPage = async ({ params, searchParams }: DashboardPageProps) => {
  const [cookieStore, { locale }, { organization = "", range: rangeParam }] =
    await Promise.all([cookies(), params, searchParams]);

  const range = resolveDashboardRange(rangeParam);
  const { hourly, bucketDays, buckets } = DASHBOARD_RANGES[range];
  const trendPeriodDays = hourly ? 1 : buckets * bucketDays;

  setRequestLocale(locale);

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
    },
  };

  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";

  const { data: organizations } = await authClient.organization.list({
    fetchOptions,
  });
  const selectedOrganization = organizations?.find(
    ({ slug }) => slug === organization,
  );

  const resolvedSlug =
    selectedOrganization?.slug ||
    organizations?.find(
      ({ id }) => id === session?.session?.activeOrganizationId,
    )?.slug ||
    organizations?.[0]?.slug;

  if (resolvedSlug && organization !== resolvedSlug) {
    const params = new URLSearchParams({ organization: resolvedSlug, range });

    redirect({ href: `/dashboard?${params.toString()}`, locale });
  }

  const organizationSlug = resolvedSlug || "";
  const resolvedOrganizationId = organizations?.find(
    ({ slug }) => slug === resolvedSlug,
  )?.id;

  const storeToday = dayjs().tz(STORE_TIMEZONE).startOf("day");

  const trendEnd = storeToday.toDate();

  const periodStart = storeToday.subtract(trendPeriodDays - 1, "day").toDate();

  const statsQuery = new URLSearchParams({
    since: periodStart.toISOString(),
    bucketUnit: hourly ? "hour" : "day",
    bucketSize: String(bucketDays),
    bucketCount: String(buckets),
  });

  const [
    userStats,
    organizationStats,
    orderStats,
    orderMenu,
    sales,
    memberRole,
  ] = await Promise.all([
    isAdmin
      ? fetcher<UserStatsResponse>(
          `/api/users/stats?${statsQuery}`,
          fetchOptions,
        ).catch(() => null)
      : Promise.resolve(null),
    fetcher<OrganizationStats>(
      `/api/users/me/organization-stats?${statsQuery}`,
      fetchOptions,
    ).catch(() => null),
    organizationSlug
      ? fetcher<OrderStatsResponse>(
          `/api/organizations/${organizationSlug}/order-stats?${statsQuery}`,
          fetchOptions,
        ).catch(() => null)
      : Promise.resolve(null),
    resolvedOrganizationId
      ? fetcher<OrderMenu>(
          `/api/organizations/${resolvedOrganizationId}/order-menu?lang=${locale}`,
          fetchOptions,
        ).catch(() => null)
      : Promise.resolve(null),
    organizationSlug
      ? fetcher<MenuItemSalesResponse[]>(
          `/api/organizations/${organizationSlug}/menu-item-sales?since=${periodStart.toISOString()}`,
          fetchOptions,
        ).catch(() => [])
      : Promise.resolve([]),
    resolvedOrganizationId
      ? authClient.organization
          .getActiveMemberRole({
            query: { organizationId: resolvedOrganizationId },
            fetchOptions,
          })
          .then(({ data }) => data?.role)
      : Promise.resolve(undefined),
  ]);

  const canViewWaitlist =
    isAdmin || hasRolePermission(memberRole, { waitlist: ["read"] });

  const [waitlistStats, waitlistStatus] =
    organizationSlug && canViewWaitlist
      ? await Promise.all([
          fetcher<WaitlistStats>(
            `/api/organizations/${organizationSlug}/waitlist/stats?since=${periodStart.toISOString()}`,
            fetchOptions,
          ).catch(() => null),
          fetcher<WaitlistStatusResponse>(
            `/api/organizations/${organizationSlug}/waitlist`,
            fetchOptions,
          ).catch(() => null),
        ])
      : [null, null];

  const topItems = [...sales]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map(({ menuItemName, sold }) => ({ name: menuItemName, quantity: sold }));

  const menuItems = (orderMenu?.sections || []).flatMap(
    ({ menuItems }) => menuItems,
  );
  const soldByMenuItemId = new Map(
    sales.map(({ menuItemId, sold }) => [menuItemId, sold]),
  );

  const slowItems = menuItems
    .map(({ id, name }) => ({ name, quantity: soldByMenuItemId.get(id) || 0 }))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  const orderBuckets = orderStats?.buckets ?? [];

  const sumOf = (values: number[]) => values.reduce((sum, n) => sum + n, 0);

  const getMoneyTrend = (key: "discount" | "revenue") => {
    const previous = orderStats?.previous[key];
    if (previous === undefined) return null;

    const data = orderBuckets.map((bucket) => bucket[key] ?? 0);

    return { data, percent: getChangePercent(previous, sumOf(data)) };
  };

  const ordersTrendData = orderBuckets.length
    ? orderBuckets.map(({ orders }) => orders)
    : Array<number>(buckets).fill(0);

  const organizationsTrendData = organizationStats
    ? organizationStats.buckets.map(({ organizations }) => organizations)
    : Array<number>(buckets).fill(0);

  return (
    <Dashboard
      organization={selectedOrganization}
      range={range}
      trendEnd={trendEnd.toISOString()}
      stats={{
        totalUsers: userStats?.total ?? null,
        totalOrganizations: organizationStats?.total ?? 0,
        totalOrders: orderStats?.lifetimeOrders ?? 0,
        ordersTrend: {
          data: ordersTrendData,
          percent: getChangePercent(
            orderStats?.previous.orders ?? 0,
            sumOf(ordersTrendData),
          ),
        },
        revenueTrend: getMoneyTrend("revenue"),
        discountTrend: getMoneyTrend("discount"),
        refundedOrders: {
          data: orderBuckets.map(({ refundedOrders }) => refundedOrders),
          total: orderStats?.refundedOrders ?? 0,
        },
        usersTrend: userStats && {
          data: userStats.buckets.map(({ users }) => users),
          percent: getChangePercent(
            userStats.previous,
            sumOf(userStats.buckets.map(({ users }) => users)),
          ),
        },
        organizationsTrend: {
          data: organizationsTrendData,
          percent: getChangePercent(
            organizationStats?.previous ?? 0,
            sumOf(organizationsTrendData),
          ),
        },
      }}
      waitlist={
        waitlistStats && (waitlistStatus?.enabled || waitlistStats.total)
          ? waitlistStats
          : null
      }
      charts={{
        coupons: orderStats?.coupons ?? [],
        modifiers: orderStats?.modifiers ?? [],
        refundedItems: orderStats?.refundedItems ?? [],
        refundReasons: orderStats?.refundReasons ?? [],
        servingTemperatureLevels: orderStats?.servingTemperatureLevels ?? [],
        sweetnessLevels: orderStats?.sweetnessLevels ?? [],
        topItems,
        slowItems,
        hourlyOrders: orderStats?.hourlyOrders ?? Array<number>(24).fill(0),
        modes: orderStats?.modes ?? [],
        paymentMethods: orderStats?.paymentMethods ?? [],
      }}
    />
  );
};

export default DashboardPage;
