import { setRequestLocale } from "next-intl/server";

import AccountSettings from ".";

import type { Locale } from "@/i18n/routing";

interface AccountSettingsPageProps {
  params: Promise<{ locale: Locale }>;
}

const AccountSettingsPage = async ({ params }: AccountSettingsPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <AccountSettings />;
};

export default AccountSettingsPage;
