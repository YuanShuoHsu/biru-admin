import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugLocation from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugLocationPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationsSlugLocationPage = async ({
  params,
}: OrganizationsSlugLocationPageProps) => {
  const [cookieStore, { locale, slug }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const { data } = await authClient.organization.getFullOrganization({
    query: { organizationSlug: decodeURIComponent(slug) },
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  if (!data) notFound();

  return <OrganizationsSlugLocation organization={data} />;
};

export default OrganizationsSlugLocationPage;
