import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Dashboard from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getAdminOrders } from "@/utils/orders";

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

  const [usersTotal, ordersData] = await Promise.all([
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
    organizationSlug
      ? getAdminOrders(organizationSlug, {}, fetchOptions)
      : Promise.resolve(null),
  ]);

  return (
    <Dashboard
      organizationSlug={organizationSlug}
      stats={{
        totalUsers: usersTotal,
        totalOrganizations: organizations?.length || 0,
        totalOrders: ordersData?.total || 0,
      }}
      recentOrders={ordersData?.orders || []}
    />
  );
};

export default DashboardPage;
