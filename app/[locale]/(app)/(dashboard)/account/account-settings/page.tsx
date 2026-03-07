// vibe coding 未來要修正

import { setRequestLocale } from "next-intl/server";

import AccountSettings from ".";

import { query } from "@/constants/query";

import type { Locale } from "@/i18n/routing";

import { getHref } from "@/utils/href";

interface AccountAccountSettingsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const AccountAccountSettingsPage = async ({
  params,
  searchParams,
}: AccountAccountSettingsPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const currentURL = getHref(`/${locale}/account/account-settings`, {
    [query.redirectTo]: redirectTo,
  });

  return <AccountSettings currentURL={currentURL} />;
};

export default AccountAccountSettingsPage;
