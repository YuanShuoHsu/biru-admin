import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Dashboard from ".";
import { DASHBOARD_RANGES, resolveDashboardRange } from "./definitions";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { OrderMenu } from "@/types/menus";
import type { OrderResponse } from "@/types/orders";

import {
  getBinnedBuckets,
  getBinnedValueBuckets,
  getHourlyBuckets,
  getHourlyValueBuckets,
  getTrendPercent,
} from "@/utils/dashboard";
import { fetcher } from "@/utils/fetcher";
import { getAdminOrders, getOrderTotalAmount } from "@/utils/orders";

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string; range?: string }>;
}

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
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const { data: session } = await authClient.getSession({ fetchOptions });
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

  const trendStart = new Date();
  trendStart.setUTCDate(trendStart.getUTCDate() - (trendFetchDays - 1));
  trendStart.setUTCHours(0, 0, 0, 0);
  const trendStartISO = trendStart.toISOString();

  const [usersTotal, usersTrendCreatedAt, ordersData, trendOrders, orderMenu] =
    await Promise.all([
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
            .then(
              ({ data }) => data?.users?.map((user) => user.createdAt) || [],
            )
        : Promise.resolve([]),
      organizationSlug
        ? getAdminOrders(organizationSlug, { pageSize: 1 }, fetchOptions)
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
          ).then(({ orders }) => orders)
        : Promise.resolve([]),
      resolvedOrganizationId
        ? fetcher<OrderMenu>(
            `/api/organizations/${resolvedOrganizationId}/order-menu?lang=${locale}`,
            fetchOptions,
          ).catch(() => null)
        : Promise.resolve(null),
    ]);

  const periodStart = new Date();
  periodStart.setUTCDate(periodStart.getUTCDate() - (trendPeriodDays - 1));
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodOrders = trendOrders.filter(
    (order) => new Date(order.createdAt) >= periodStart,
  );

  const itemQuantities = new Map<string, number>();
  for (const order of periodOrders) {
    for (const item of order.items) {
      itemQuantities.set(
        item.menuItemName,
        (itemQuantities.get(item.menuItemName) || 0) + item.orderQuantity,
      );
    }
  }
  const itemsByQuantity = [...itemQuantities.entries()].map(
    ([name, quantity]) => ({ name, quantity }),
  );
  const topItems = [...itemsByQuantity]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const menuItemNames = new Set(
    (orderMenu?.sections || []).flatMap(({ menuItems }) =>
      menuItems.map(({ name }) => name),
    ),
  );
  for (const name of itemQuantities.keys()) menuItemNames.delete(name);

  const slowItems = [
    ...[...menuItemNames].map((name) => ({ name, quantity: 0 })),
    ...itemsByQuantity,
  ]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  const hourlyOrders = Array<number>(24).fill(0);
  for (const order of periodOrders) {
    hourlyOrders[new Date(order.createdAt).getHours()] += 1;
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
      value: getOrderTotalAmount(order),
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
