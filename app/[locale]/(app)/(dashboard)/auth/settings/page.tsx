import { setRequestLocale } from "next-intl/server";

import AuthSettings from ".";

import type { Locale } from "@/i18n/routing";

interface AuthSettingsPageProps {
  params: Promise<{ locale: Locale }>;
}

const AuthSettingsPage = async ({ params }: AuthSettingsPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <AuthSettings />;
};

export default AuthSettingsPage;
