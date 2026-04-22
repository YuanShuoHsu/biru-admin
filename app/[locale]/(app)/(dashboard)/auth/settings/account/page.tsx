import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import Account from ".";

import { routing } from "@/i18n/routing";

const AuthSettingsAccountPage = async ({
  params,
}: PageProps<"/[locale]/auth/settings/account">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <Account />;
};

export default AuthSettingsAccountPage;
