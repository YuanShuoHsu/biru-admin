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

import type { OrderMenu } from "@/types/menus";
import type { MenuItemSalesResponse, OrderResponse } from "@/types/orders";

import {
  getBinnedBuckets,
  getBinnedValueBuckets,
  getHourlyBuckets,
  getHourlyValueBuckets,
  getTrendPercent,
} from "@/utils/dashboard";
import { fetcher } from "@/utils/fetcher";
import { getAdminOrders, isCountedOrder } from "@/utils/orders";
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
  const t = await getTranslations({ locale });

  return { title: t("dashboard.label") };
};

const DashboardPage = async ({ params, searchParams }: DashboardPageProps) => {
  const [cookieStore, { locale }, { organization = "", range: rangeParam }] =
    await Promise.all([cookies(), params, searchParams]);

  const range = resolveDashboardRange(rangeParam);
  const { hourly, bucketDays, buckets } = DASHBOARD_RANGES[range];
  const trendPeriodDays = hourly ? 1 : buckets * bucketDays;
  const trendFetchDays = trendPeriodDays * 2;

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

  if (resolvedSlug && (organization !== resolvedSlug || rangeParam !== range)) {
    const params = new URLSearchParams({ organization: resolvedSlug, range });

    redirect({ href: `/dashboard?${params.toString()}`, locale });
  }

  const organizationSlug = resolvedSlug || "";
  const resolvedOrganizationId = organizations?.find(
    ({ slug }) => slug === resolvedSlug,
  )?.id;

  const trendStart = dayjs()
    .tz(STORE_TIMEZONE)
    .startOf("day")
    .subtract(trendFetchDays - 1, "day")
    .toDate();
  const trendStartISO = trendStart.toISOString();

  const periodStart = dayjs()
    .tz(STORE_TIMEZONE)
    .startOf("day")
    .subtract(trendPeriodDays - 1, "day")
    .toDate();

  const [
    usersTotal,
    usersTrendCreatedAt,
    ordersData,
    trendOrders,
    orderMenu,
    sales,
  ] = await Promise.all([
    isAdmin
      ? authClient.admin
          .listUsers({
            query: {
              limit: 1,
              offset: 0,
              sortBy: "createdAt",
              sortDirection: "desc",
            },
            fetchOptions,
          })
          .then(({ data }) => data?.total || 0)
      : Promise.resolve(null),
    isAdmin
      ? authClient.admin
          .listUsers({
            query: {
              limit: 1000,
              offset: 0,
              sortBy: "createdAt",
              sortDirection: "asc",
              filterField: "createdAt",
              filterOperator: "gte",
              filterValue: trendStartISO,
            },
            fetchOptions,
          })
          .then(({ data }) => data?.users?.map((user) => user.createdAt) || [])
      : Promise.resolve([]),
    organizationSlug
      ? // 後端篩選僅支援單一欄位，無法完整表達 isCountedOrder 的口徑，
        // 這裡排除佔最大宗的已取消訂單；付款失敗與尚未付款的線上訂單仍會計入
        getAdminOrders(
          organizationSlug,
          {
            filterField: "orderStatus",
            filterOperator: "not",
            filterValue: "OrderCancelled",
            pageSize: 1,
          },
          fetchOptions,
        )
      : Promise.resolve(null),
    organizationSlug
      ? getAdminOrders(
          organizationSlug,
          {
            filterField: "createdAt",
            filterOperator: "onOrAfter",
            filterValue: trendStartISO,
            sortBy: "createdAt",
            sortDirection: "asc",
            pageSize: 1000,
          },
          fetchOptions,
        ).then(({ orders }) => orders.filter(isCountedOrder))
      : Promise.resolve([]),
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
  ]);

  const periodOrders = trendOrders.filter(
    (order) => new Date(order.createdAt) >= periodStart,
  );

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

  const hourlyOrders = Array<number>(24).fill(0);
  for (const order of periodOrders) {
    hourlyOrders[dayjs(order.createdAt).tz(STORE_TIMEZONE).hour()] += 1;
  }

  const countBy = <Key extends string>(getKey: (order: OrderResponse) => Key) =>
    periodOrders.reduce<Partial<Record<Key, number>>>((counts, order) => {
      const key = getKey(order);

      counts[key] = (counts[key] || 0) + 1;

      return counts;
    }, {});

  const modeCounts = countBy((order) => order.mode);
  const paymentCounts = countBy((order) => order.paymentMethod);

  const organizationsTrendCreatedAt = (organizations || [])
    .filter((organization) => new Date(organization.createdAt) >= trendStart)
    .map((organization) => organization.createdAt);

  const trendBucketCount = buckets * 2;

  const getTrendBuckets = (createdAts: (string | Date)[]) =>
    hourly
      ? getHourlyBuckets(createdAts, trendBucketCount, trendStart)
      : getBinnedBuckets(createdAts, trendBucketCount, bucketDays);
  const getTrendValueBuckets = (
    entries: { date: string | Date; value: number }[],
  ) =>
    hourly
      ? getHourlyValueBuckets(entries, trendBucketCount, trendStart)
      : getBinnedValueBuckets(entries, trendBucketCount, bucketDays);

  const currency = trendOrders[0]?.items[0]?.priceCurrency || "";

  const ordersTrendBuckets = getTrendBuckets(
    trendOrders.map((order) => order.createdAt),
  );
  const revenueTrendBuckets = getTrendValueBuckets(
    trendOrders.map((order) => ({
      date: order.createdAt,
      value: Number(order.total),
    })),
  );
  const usersTrendBuckets = getTrendBuckets(usersTrendCreatedAt);
  const organizationsTrendBuckets = getTrendBuckets(
    organizationsTrendCreatedAt,
  );

  return (
    <Dashboard
      currency={currency}
      range={range}
      stats={{
        totalUsers: usersTotal,
        totalOrganizations: organizations?.length || 0,
        totalOrders: ordersData?.total || 0,
        ordersTrend: {
          data: ordersTrendBuckets.slice(buckets),
          percent: getTrendPercent(ordersTrendBuckets),
        },
        revenueTrend: {
          data: revenueTrendBuckets.slice(buckets),
          percent: getTrendPercent(revenueTrendBuckets),
        },
        usersTrend: isAdmin
          ? {
              data: usersTrendBuckets.slice(buckets),
              percent: getTrendPercent(usersTrendBuckets),
            }
          : null,
        organizationsTrend: {
          data: organizationsTrendBuckets.slice(buckets),
          percent: getTrendPercent(organizationsTrendBuckets),
        },
      }}
      charts={{
        topItems,
        slowItems,
        hourlyOrders,
        modeCounts,
        paymentCounts,
      }}
    />
  );
};

export default DashboardPage;
