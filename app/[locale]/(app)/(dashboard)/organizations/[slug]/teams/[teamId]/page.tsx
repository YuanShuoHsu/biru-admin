import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugTeamsTeamId from ".";

import type { Locale } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugTeamsTeamIdPageProps {
  params: Promise<{ locale: Locale; slug: string; teamId: string }>;
}

const OrganizationsSlugTeamsTeamIdPage = async ({
  params,
}: OrganizationsSlugTeamsTeamIdPageProps) => {
  const [cookieStore, { locale, slug, teamId }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const cookieHeader = { cookie: cookieStore.toString() };

  const [{ data: activeOrganization }, { data: teamMembers }] =
    await Promise.all([
      authClient.organization.getFullOrganization({
        query: { organizationSlug: decodeURIComponent(slug) },
        fetchOptions: { headers: cookieHeader },
      }),
      authClient.organization.listTeamMembers({
        query: { teamId },
        fetchOptions: { headers: cookieHeader },
      }),
    ]);
  if (!activeOrganization) notFound();

  const team = activeOrganization.teams.find(({ id }) => id === teamId);
  if (!team) notFound();

  return (
    <OrganizationsSlugTeamsTeamId
      activeOrganization={activeOrganization}
      team={team}
      teamMembers={teamMembers?.toReversed() || []}
    />
  );
};

export default OrganizationsSlugTeamsTeamIdPage;
