// vibe coding 未來要修正

import { setRequestLocale } from "next-intl/server";

import AccountProfile from ".";

import { query } from "@/constants/query";

import type { Locale } from "@/i18n/routing";

import { getHref } from "@/utils/href";

interface AccountProfilePageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const AccountProfilePage = async ({
  params,
  searchParams,
}: AccountProfilePageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const currentURL = getHref(`/${locale}/account/profile`, {
    [query.redirectTo]: redirectTo,
  });

  return <AccountProfile currentURL={currentURL} />;
};

export default AccountProfilePage;
