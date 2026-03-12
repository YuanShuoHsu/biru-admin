import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

interface OrganizationsPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrganizationsPage = async ({ params }: OrganizationsPageProps) => {
  const cookieStore = await cookies();
  const [{ locale }, { data }] = await Promise.all([
    params,
    authClient.organization.list({
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
  ]);

  setRequestLocale(locale);

  return <Organizations organizations={data || []} />;
};

export default OrganizationsPage;
