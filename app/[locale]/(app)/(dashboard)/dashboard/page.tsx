import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Dashboard from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getDailyBuckets, getTrendPercent } from "@/utils/dashboard";
import { getAdminOrders } from "@/utils/orders";

const TREND_PERIOD_DAYS = 30;
const TREND_FETCH_DAYS = TREND_PERIOD_DAYS * 2;

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>;
}

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

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
  const organizationSlug = organizations?.[0]?.slug || "";

  const trendStart = new Date();
  trendStart.setUTCDate(trendStart.getUTCDate() - (TREND_FETCH_DAYS - 1));
  trendStart.setUTCHours(0, 0, 0, 0);
  const trendStartISO = trendStart.toISOString();

  const [usersTotal, usersTrendCreatedAt, ordersData, ordersTrendCreatedAt] =
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
          ).then(({ orders }) => orders.map((order) => order.createdAt))
        : Promise.resolve([]),
    ]);

  const organizationsTrendCreatedAt = (organizations || [])
    .filter((organization) => new Date(organization.createdAt) >= trendStart)
    .map((organization) => organization.createdAt);

  const ordersTrendBuckets = getDailyBuckets(
    ordersTrendCreatedAt,
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
      recentOrders={ordersData?.orders || []}
    />
  );
};

export default DashboardPage;
