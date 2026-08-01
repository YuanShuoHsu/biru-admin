import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SWRConfig, unstable_serialize } from "swr";

import Security from ".";

import { swrKeys } from "@/constants/swr";

import { routing } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/auth/settings/security">): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale });

  return { title: t("auth.settings.security.label") };
};

const AuthSettingsSecurityPage = async ({
  params,
}: PageProps<"/[locale]/auth/settings/security">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const reqHeaders = await headers();
  const [{ data: session }, { data: accounts }] = await Promise.all([
    authClient.getSession({ fetchOptions: { headers: reqHeaders } }),
    authClient.listAccounts({ fetchOptions: { headers: reqHeaders } }),
  ]);

  const fallback = session
    ? {
        [unstable_serialize([swrKeys.listAccounts, session.user.id])]: accounts,
      }
    : {};

  return (
    <SWRConfig value={{ fallback }}>
      <Security />
    </SWRConfig>
  );
};

export default AuthSettingsSecurityPage;
