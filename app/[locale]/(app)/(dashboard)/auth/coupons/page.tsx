import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Coupons from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { routing } from "@/i18n/routing";

import type { MyClaimableCoupon, MyCoupon } from "@/types/coupons";

import { fetcher, settle } from "@/utils/fetcher";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/auth/coupons">): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const tAuth = await getTranslations({ locale, namespace: "auth" });

  return { title: tAuth("coupons.label") };
};

const AuthCouponsPage = async () => {
  const reqHeaders = await headers();
  const cookie = reqHeaders.get("cookie") || "";
  const [
    { data: claimableCoupons, error: claimableError },
    { data: coupons, error },
  ] = await Promise.all([
    settle(
      fetcher<MyClaimableCoupon[]>("/api/users/me/coupons/claimable", {
        headers: { cookie },
      }),
    ),
    settle(
      fetcher<MyCoupon[]>("/api/users/me/coupons", { headers: { cookie } }),
    ),
  ]);
  if (claimableError || error) return <ErrorAlert />;

  const availableCoupons = coupons.filter(
    ({ coupon, usedAt }) =>
      !usedAt &&
      coupon.isActive &&
      (!coupon.validThrough || new Date(coupon.validThrough) >= new Date()),
  );

  return (
    <Coupons claimableCoupons={claimableCoupons} coupons={availableCoupons} />
  );
};

export default AuthCouponsPage;
