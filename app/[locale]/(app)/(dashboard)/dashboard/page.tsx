import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Dashboard from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { OrderResponse } from "@/types/orders";

import {
  getDailyBuckets,
  getDailyValueBuckets,
  getTrendPercent,
} from "@/utils/dashboard";
import { getAdminOrders, getOrderTotalAmount } from "@/utils/orders";

const TREND_PERIOD_DAYS = 30;
const TREND_FETCH_DAYS = TREND_PERIOD_DAYS * 2;

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

const DashboardPage = async ({ params, searchParams }: DashboardPageProps) => {
  const [cookieStore, { locale }, { organization = "" }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

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

  if (!selectedOrganization) {
    const fallbackSlug =
      organizations?.find(
        ({ id }) => id === session?.session?.activeOrganizationId,
      )?.slug || organizations?.[0]?.slug;

    if (fallbackSlug) {
      redirect({ href: `/dashboard?organization=${fallbackSlug}`, locale });
    }
  }

  const organizationSlug = selectedOrganization?.slug || "";

  const trendStart = new Date();
  trendStart.setUTCDate(trendStart.getUTCDate() - (TREND_FETCH_DAYS - 1));
  trendStart.setUTCHours(0, 0, 0, 0);
  const trendStartISO = trendStart.toISOString();

  const [usersTotal, usersTrendCreatedAt, ordersData, trendOrders] =
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
        ? getAdminOrders(organizationSlug, {}, fetchOptions)
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
    ]);

  const periodStart = new Date();
  periodStart.setUTCDate(periodStart.getUTCDate() - (TREND_PERIOD_DAYS - 1));
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
  const topItems = [...itemQuantities.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
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

  const ordersTrendBuckets = getDailyBuckets(
    trendOrders.map((order) => order.createdAt),
    TREND_FETCH_DAYS,
  );
  const revenueTrendBuckets = getDailyValueBuckets(
    trendOrders.map((order) => ({
      date: order.createdAt,
      value: getOrderTotalAmount(order),
    })),
    TREND_FETCH_DAYS,
  );
  const usersTrendBuckets = getDailyBuckets(
    usersTrendCreatedAt,
    TREND_FETCH_DAYS,
  );
  const organizationsTrendBuckets = getDailyBuckets(
    organizationsTrendCreatedAt,
    TREND_FETCH_DAYS,
  );

  return (
    <Dashboard
      organizationSlug={organizationSlug}
      stats={{
        totalUsers: usersTotal,
        totalOrganizations: organizations?.length || 0,
        totalOrders: ordersData?.total || 0,
        ordersTrend: {
          data: ordersTrendBuckets.slice(TREND_PERIOD_DAYS),
          percent: getTrendPercent(ordersTrendBuckets),
        },
        revenueTrend: {
          data: revenueTrendBuckets.slice(TREND_PERIOD_DAYS),
          percent: getTrendPercent(revenueTrendBuckets),
        },
        usersTrend: isAdmin
          ? {
              data: usersTrendBuckets.slice(TREND_PERIOD_DAYS),
              percent: getTrendPercent(usersTrendBuckets),
            }
          : null,
        organizationsTrend: {
          data: organizationsTrendBuckets.slice(TREND_PERIOD_DAYS),
          percent: getTrendPercent(organizationsTrendBuckets),
        },
      }}
      charts={{
        topItems,
        hourlyOrders,
        modeCounts,
        paymentCounts,
      }}
      recentOrders={ordersData?.orders || []}
    />
  );
};

export default DashboardPage;
