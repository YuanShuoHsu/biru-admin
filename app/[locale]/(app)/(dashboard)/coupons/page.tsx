import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Coupons from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { Coupon } from "@/types/coupons";
import type { OrderMenu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { getAdminOrganization } from "@/utils/menus";

interface CouponsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

const CouponsPage = async ({ params, searchParams }: CouponsPageProps) => {
  const [cookieStore, { locale }, { organization }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getAdminOrganization(
    organization,
    fetchOptions,
  );

  if (!selectedOrganization) return null;

  if (organization !== selectedOrganization.slug) {
    redirect({
      href: `/coupons?organization=${selectedOrganization.slug}`,
      locale,
    });
  }

  const [coupons, menu, sessionData, fullOrgData] = await Promise.all([
    fetcher<Coupon[]>(
      `/api/organizations/${selectedOrganization.slug}/coupons`,
      fetchOptions,
    ),
    fetcher<OrderMenu>(
      `/api/organizations/${selectedOrganization.id}/order-menu?lang=${locale}`,
      fetchOptions,
    ).catch(() => null),
    authClient.getSession({ fetchOptions }),
    authClient.organization.getFullOrganization({
      query: { organizationId: selectedOrganization.id },
      fetchOptions,
    }),
  ]);

  const currentUserId = sessionData.data?.user?.id;
  const members = fullOrgData.data?.members || [];
  const role = members.find(({ userId }) => userId === currentUserId)?.role;
  const canWrite = role === "owner" || role === "admin";

  return (
    <Coupons
      canWrite={canWrite}
      coupons={coupons}
      menu={menu}
      organizationSlug={selectedOrganization.slug}
    />
  );
};

export default CouponsPage;
