// vibe coding 未來要修正

import { setRequestLocale } from "next-intl/server";

import MyAccount from ".";

import { query } from "@/constants/query";

import type { Locale } from "@/i18n/routing";

import { getHref } from "@/utils/href";

interface MyAccountPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const MyAccountPage = async ({ params, searchParams }: MyAccountPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const currentURL = getHref(`/${locale}/account/my-account`, {
    [query.redirectTo]: redirectTo,
  });

  return <MyAccount currentURL={currentURL} />;
};

export default MyAccountPage;
