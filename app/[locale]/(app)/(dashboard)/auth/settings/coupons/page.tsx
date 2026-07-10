import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Coupons from ".";

import { routing } from "@/i18n/routing";

import type { MyCoupon } from "@/types/coupons";

import { fetcher } from "@/utils/fetcher";

const AuthSettingsCouponsPage = async ({
  params,
}: PageProps<"/[locale]/auth/settings/coupons">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const reqHeaders = await headers();
  const coupons = await fetcher<MyCoupon[]>("/api/users/me/coupons", {
    headers: { cookie: reqHeaders.get("cookie") || "" },
  }).catch(() => []);

  return <Coupons coupons={coupons} />;
};

export default AuthSettingsCouponsPage;
