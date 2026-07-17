import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Coupons from ".";

import type { Locale } from "@/i18n/routing";

import type { Coupon } from "@/types/coupons";

import { fetcher } from "@/utils/fetcher";
import { getOrganizations } from "@/utils/organizations";

interface CouponsPageProps {
  params: Promise<{ locale: Locale }>;
}

const CouponsPage = async ({ params }: CouponsPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [coupons, organizations] = await Promise.all([
    fetcher<Coupon[]>("/api/coupons", fetchOptions).catch(() => null),
    getOrganizations(fetchOptions),
  ]);

  if (!coupons) return null;

  return <Coupons coupons={coupons} organizations={organizations} />;
};

export default CouponsPage;
