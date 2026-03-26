import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

interface OrganizationsPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrganizationsPage = async ({ params }: OrganizationsPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const { data } = await authClient.organization.list({
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  return <Organizations rows={(data || []).toReversed()} />;
};

export default OrganizationsPage;
