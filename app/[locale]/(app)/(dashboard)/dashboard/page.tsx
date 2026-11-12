// https://nextjs.org/docs/app/guides/interactive-apps#step-1-stream-slow-data-with-suspense

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Coupons from "./Coupons";
import Menus, { type MenuItemSales } from "./Menus";
import Orders from "./Orders";
import Overview from "./Overview";
import Waitlist from "./Waitlist";
import {
  DASHBOARD_RANGES,
  type DashboardRange,
  resolveDashboardRange,
} from "./definitions";
import { SectionsStack } from "./styled";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type { UserStatsResponse } from "@/types/admins";
import type { OrderMenu } from "@/types/menus";
import type { MenuItemSalesResponse, OrderStatsResponse } from "@/types/orders";
import type { OrganizationStats } from "@/types/organizations";
import type { WaitlistStats, WaitlistStatusResponse } from "@/types/waitlist";

import {
  getChangePercent,
  getDashboardPeriod,
  getMoneyTrend,
  sumOf,
} from "@/utils/dashboard";
import { type FetchResult, fetcher, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

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

interface OverviewContentProps {
  currency: string;
  isAdmin: boolean;
  orderStats: Promise<FetchResult<OrderStatsResponse | null>>;
  organizationStats: Promise<FetchResult<OrganizationStats>>;
  range: DashboardRange;
  userStats: Promise<FetchResult<UserStatsResponse | null>>;
}

const OverviewContent = async ({
  currency,
  isAdmin,
  orderStats: orderStatsPromise,
  organizationStats: organizationStatsPromise,
  range,
  userStats: userStatsPromise,
}: OverviewContentProps) => {
  const [userStatsResult, organizationStatsResult, orderStatsResult] =
    await Promise.all([
      userStatsPromise,
      organizationStatsPromise,
      orderStatsPromise,
    ]);

  if (
    userStatsResult.error ||
    organizationStatsResult.error ||
    orderStatsResult.error
  )
    return <ErrorAlert />;

  const userStats = userStatsResult.data;
  const organizationStats = organizationStatsResult.data;
  const orderStats = orderStatsResult.data;

  const orderBuckets = orderStats?.buckets ?? [];

  const ordersTrendData = orderBuckets.length
    ? orderBuckets.map(({ orders }) => orders)
    : Array<number>(DASHBOARD_RANGES[range].buckets).fill(0);
  const usersTrendData = (userStats?.buckets ?? []).map(({ users }) => users);
  const organizationsTrendData = organizationStats.buckets.map(
    ({ organizations }) => organizations,
  );

  return (
    <Overview
      currency={currency}
      isAdmin={isAdmin}
      range={range}
      trendStarts={organizationStats.buckets.map(({ start }) => start)}
      stats={{
        totalUsers: userStats?.total ?? null,
        totalOrganizations: organizationStats.total,
        totalOrders: orderStats?.lifetimeOrders ?? 0,
        ordersTrend: {
          data: ordersTrendData,
          percent: getChangePercent(
            orderStats?.previous.orders ?? 0,
            sumOf(ordersTrendData),
          ),
        },
        revenueTrend: getMoneyTrend(orderStats, "revenue"),
        usersTrend: userStats && {
          data: usersTrendData,
          percent: getChangePercent(userStats.previous, sumOf(usersTrendData)),
        },
        organizationsTrend: {
          data: organizationsTrendData,
          percent: getChangePercent(
            organizationStats.previous,
            sumOf(organizationsTrendData),
          ),
        },
      }}
    />
  );
};

interface OrdersContentProps {
  orderStats: Promise<FetchResult<OrderStatsResponse | null>>;
  range: DashboardRange;
}

const OrdersContent = async ({
  orderStats: orderStatsPromise,
  range,
}: OrdersContentProps) => {
  const orderStatsResult = await orderStatsPromise;

  if (orderStatsResult.error) return <ErrorAlert />;

  return <Orders orderStats={orderStatsResult.data} range={range} />;
};

interface MenusContentProps {
  orderMenu: Promise<FetchResult<OrderMenu | null>>;
  orderStats: Promise<FetchResult<OrderStatsResponse | null>>;
  range: DashboardRange;
  sales: Promise<FetchResult<MenuItemSalesResponse[]>>;
}

const MenusContent = async ({
  orderMenu: orderMenuPromise,
  orderStats: orderStatsPromise,
  range,
  sales: salesPromise,
}: MenusContentProps) => {
  const [orderMenuResult, orderStatsResult, salesResult] = await Promise.all([
    orderMenuPromise,
    orderStatsPromise,
    salesPromise,
  ]);

  if (orderMenuResult.error || orderStatsResult.error || salesResult.error)
    return <ErrorAlert />;

  const orderMenu = orderMenuResult.data;
  const sales = salesResult.data;

  const menuItems = (orderMenu?.sections || []).flatMap(
    ({ menuItems }) => menuItems,
  );
  const nameByMenuItemId = new Map(menuItems.map(({ id, name }) => [id, name]));

  const topItems: MenuItemSales[] = [...sales]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map(({ menuItemId, menuItemName, sold }) => ({
      name: nameByMenuItemId.get(menuItemId) ?? menuItemName,
      quantity: sold,
    }));

  const soldByMenuItemId = new Map(
    sales.map(({ menuItemId, sold }) => [menuItemId, sold]),
  );

  const slowItems: MenuItemSales[] = menuItems
    .map(({ id, name }) => ({ name, quantity: soldByMenuItemId.get(id) || 0 }))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  return (
    <Menus
      orderStats={orderStatsResult.data}
      range={range}
      slowItems={slowItems}
      topItems={topItems}
    />
  );
};

interface CouponsContentProps {
  currency: string;
  orderStats: Promise<FetchResult<OrderStatsResponse | null>>;
  range: DashboardRange;
}

const CouponsContent = async ({
  currency,
  orderStats: orderStatsPromise,
  range,
}: CouponsContentProps) => {
  const orderStatsResult = await orderStatsPromise;

  if (orderStatsResult.error) return <ErrorAlert />;

  return (
    <Coupons
      currency={currency}
      orderStats={orderStatsResult.data}
      range={range}
    />
  );
};

interface WaitlistContentProps {
  range: DashboardRange;
  waitlist: Promise<
    [
      FetchResult<WaitlistStats | null>,
      FetchResult<WaitlistStatusResponse | null>,
    ]
  >;
}

const WaitlistContent = async ({
  range,
  waitlist: waitlistPromise,
}: WaitlistContentProps) => {
  const [waitlistStatsResult, waitlistStatusResult] = await waitlistPromise;

  if (waitlistStatsResult.error || waitlistStatusResult.error)
    return <ErrorAlert />;

  const waitlistStats = waitlistStatsResult.data;
  const waitlistStatus = waitlistStatusResult.data;

  if (!waitlistStats || !(waitlistStatus?.enabled || waitlistStats.total))
    return null;

  return <Waitlist range={range} waitlist={waitlistStats} />;
};

const DashboardContent = async ({
  params,
  searchParams,
}: DashboardPageProps) => {
  const [cookieStore, { locale }, { organization = "", range: rangeParam }] =
    await Promise.all([cookies(), params, searchParams]);

  const range = resolveDashboardRange(rangeParam);

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
    },
  };

  const [session, selectedOrganization] = await Promise.all([
    getSession(),
    getResolvedAdminOrganization(organization),
  ]);
  const isAdmin = session?.user?.role === "admin";

  if (organization && !selectedOrganization) notFound();

  if (selectedOrganization && organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
      range,
    });

    redirect({ href: `/dashboard?${params.toString()}`, locale });
  }

  const organizationSlug = selectedOrganization?.slug ?? "";
  const resolvedOrganizationId = selectedOrganization?.id;
  const currency = selectedOrganization?.currency ?? "";

  const { periodStart, periodEnd, statsQuery } = getDashboardPeriod(range);

  const userStats = settle(
    isAdmin
      ? fetcher<UserStatsResponse>(
          `/api/users/stats?${statsQuery}`,
          fetchOptions,
        )
      : Promise.resolve(null),
  );
  const organizationStats = settle(
    fetcher<OrganizationStats>(
      `/api/users/me/organization-stats?${statsQuery}`,
      fetchOptions,
    ),
  );
  const orderStats = settle(
    organizationSlug
      ? fetcher<OrderStatsResponse>(
          `/api/organizations/${organizationSlug}/order-stats?${statsQuery}`,
          fetchOptions,
        )
      : Promise.resolve(null),
  );
  const orderMenu = settle(
    resolvedOrganizationId
      ? fetcher<OrderMenu | null>(
          `/api/organizations/${resolvedOrganizationId}/order-menu?lang=${locale}`,
          fetchOptions,
        )
      : Promise.resolve(null),
  );
  const sales = settle(
    organizationSlug
      ? fetcher<MenuItemSalesResponse[]>(
          `/api/organizations/${organizationSlug}/menu-item-sales?since=${periodStart.toISOString()}&until=${periodEnd.toISOString()}`,
          fetchOptions,
        )
      : Promise.resolve([]),
  );
  const waitlist = (
    resolvedOrganizationId
      ? getMemberRole(resolvedOrganizationId)
      : Promise.resolve(null)
  ).then((memberRole) => {
    const canViewWaitlist =
      !!organizationSlug &&
      (isAdmin || hasRolePermission(memberRole, { waitlist: ["read"] }));

    return Promise.all([
      settle(
        canViewWaitlist
          ? fetcher<WaitlistStats>(
              `/api/organizations/${organizationSlug}/waitlist/stats?since=${periodStart.toISOString()}&until=${periodEnd.toISOString()}`,
              fetchOptions,
            )
          : Promise.resolve(null),
      ),
      settle(
        canViewWaitlist
          ? fetcher<WaitlistStatusResponse>(
              `/api/organizations/${organizationSlug}/waitlist`,
              fetchOptions,
            )
          : Promise.resolve(null),
      ),
    ]);
  });

  return (
    <SectionsStack className="group-has-data-pending:opacity-50">
      <Suspense fallback={<Overview isAdmin={isAdmin} loading range={range} />}>
        <OverviewContent
          currency={currency}
          isAdmin={isAdmin}
          orderStats={orderStats}
          organizationStats={organizationStats}
          range={range}
          userStats={userStats}
        />
      </Suspense>
      <Suspense fallback={<Orders loading range={range} />}>
        <OrdersContent orderStats={orderStats} range={range} />
      </Suspense>
      <Suspense fallback={<Menus loading range={range} />}>
        <MenusContent
          orderMenu={orderMenu}
          orderStats={orderStats}
          range={range}
          sales={sales}
        />
      </Suspense>
      <Suspense fallback={<Coupons loading range={range} />}>
        <CouponsContent
          currency={currency}
          orderStats={orderStats}
          range={range}
        />
      </Suspense>
      <Suspense>
        <WaitlistContent range={range} waitlist={waitlist} />
      </Suspense>
    </SectionsStack>
  );
};

const DashboardPage = (props: DashboardPageProps) => (
  <Suspense
    fallback={
      <SectionsStack>
        <Overview loading />
        <Orders loading />
        <Menus loading />
        <Coupons loading />
      </SectionsStack>
    }
  >
    <DashboardContent {...props} />
  </Suspense>
);

export default DashboardPage;
