import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import Security from ".";

import { routing } from "@/i18n/routing";

const AuthSettingsSecurityPage = async ({
  params,
}: PageProps<"/[locale]/auth/settings/security">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <Security />;
};

export default AuthSettingsSecurityPage;
