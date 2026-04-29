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

  const [{ data: org }, { data: teamMembers }] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: cookieHeader },
    }),
    authClient.organization.listTeamMembers({
      query: { teamId },
      fetchOptions: { headers: cookieHeader },
    }),
  ]);

  if (!org) notFound();

  const team = org.teams.find(({ id }) => id === teamId);
  if (!team) notFound();

  return (
    <OrganizationsSlugTeamsTeamId
      members={org.members.toReversed()}
      orgSlug={slug}
      team={team}
      teamMembers={teamMembers ?? []}
    />
  );
};

export default OrganizationsSlugTeamsTeamIdPage;
