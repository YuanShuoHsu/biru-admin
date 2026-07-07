import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import Orders from ".";

import { routing } from "@/i18n/routing";

const AuthSettingsOrdersPage = async ({
  params,
}: PageProps<"/[locale]/auth/settings/orders">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <Orders />;
};

export default AuthSettingsOrdersPage;
