import { setRequestLocale } from "next-intl/server";

import AddAnotherAccount from ".";

import type { Locale } from "@/i18n/routing";

interface AccountAddAnotherAccountPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const AccountAddAnotherAccountPage = async ({
  params,
  searchParams,
}: AccountAddAnotherAccountPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  return <AddAnotherAccount redirectTo={safeRedirectTo} />;
};

export default AccountAddAnotherAccountPage;
