import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugTeams from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugTeamsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationsSlugTeamsPage = async ({
  params,
}: OrganizationsSlugTeamsPageProps) => {
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

  return (
    <OrganizationsSlugTeams
      members={data.members}
      organizationId={data.id}
      teams={data.teams.toReversed()}
    />
  );
};

export default OrganizationsSlugTeamsPage;
