import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Coupons from ".";

import { routing } from "@/i18n/routing";

import type { MyClaimableCoupon, MyCoupon } from "@/types/coupons";

import { fetcher } from "@/utils/fetcher";

const AuthCouponsPage = async ({
  params,
}: PageProps<"/[locale]/auth/coupons">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const reqHeaders = await headers();
  const cookie = reqHeaders.get("cookie") || "";
  const [claimableCoupons, coupons] = await Promise.all([
    fetcher<MyClaimableCoupon[]>("/api/users/me/coupons/claimable", {
      headers: { cookie },
    }).catch(() => []),
    fetcher<MyCoupon[]>("/api/users/me/coupons", {
      headers: { cookie },
    }).catch(() => []),
  ]);

  const availableCoupons = coupons.filter(
    ({ coupon, usedAt }) =>
      !usedAt &&
      (!coupon.validThrough || new Date(coupon.validThrough) >= new Date()),
  );

  return (
    <Coupons claimableCoupons={claimableCoupons} coupons={availableCoupons} />
  );
};

export default AuthCouponsPage;
