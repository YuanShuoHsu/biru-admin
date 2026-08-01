import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import Account from ".";

import { routing } from "@/i18n/routing";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/auth/settings/account">): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale });

  return { title: t("auth.settings.account.label") };
};

const AuthSettingsAccountPage = async ({
  params,
}: PageProps<"/[locale]/auth/settings/account">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <Account />;
};

export default AuthSettingsAccountPage;
