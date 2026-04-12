import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Dashboard from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { Order } from "@/types/orders";

import { getOrders } from "@/utils/orders";

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>;
}

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_NEXT_URL!,
    },
  };

  const [usersData, organizationsData, ordersData] = await Promise.all([
    authClient.admin
      .listUsers({
        query: {
          limit: 1,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        fetchOptions,
      })
      .then(({ data }) => ({ total: data?.total || 0 }))
      .catch(() => ({ total: 0 })),
    authClient.organization
      .list({ fetchOptions })
      .then(({ data }) => ({ total: data?.length || 0 }))
      .catch(() => ({ total: 0 })),
    getOrders({
      page: 1,
      limit: 5,
      status: "",
      search: "",
      sortBy: "createdAt",
      sortDir: "desc",
    }).catch(() => ({ data: [] as Order[], total: 0, page: 1, limit: 5 })),
  ]);

  return (
    <Dashboard
      stats={{
        totalUsers: usersData.total,
        totalOrganizations: organizationsData.total,
        totalOrders: ordersData.total,
      }}
      recentOrders={ordersData.data}
    />
  );
};

export default DashboardPage;
