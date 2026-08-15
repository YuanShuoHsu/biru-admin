import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugTeamsTeamId from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission } from "@/utils/organizations";

import { buildTeamMembers } from "@/utils/teams";

interface OrganizationsSlugTeamsTeamIdPageProps {
  params: Promise<{ locale: Locale; slug: string; teamId: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugTeamsTeamIdPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("organizations.teams.label") };
};

const OrganizationsSlugTeamsTeamIdPage = async ({
  params,
}: OrganizationsSlugTeamsTeamIdPageProps) => {
  const [cookieStore, { locale, slug, teamId }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const cookieHeader = { cookie: cookieStore.toString() };

  const [
    { data: activeOrganization },
    { data: teamMemberData },
    { data: session },
  ] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: cookieHeader },
    }),
    authClient.organization.listTeamMembers({
      query: { teamId },
      fetchOptions: { headers: cookieHeader },
    }),
    authClient.getSession({
      fetchOptions: {
        headers: {
          ...cookieHeader,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    }),
  ]);

  if (!activeOrganization || !session?.user?.id) notFound();

  const team = activeOrganization.teams.find(({ id }) => id === teamId);
  if (!team) notFound();

  const teamMembers = buildTeamMembers(
    teamMemberData || [],
    activeOrganization.members,
  );

  const currentUserRole = activeOrganization.members.find(
    ({ userId }) => userId === session.user.id,
  )?.role;

  const canUpdateTeam = hasRolePermission(currentUserRole, {
    team: ["update"],
  });

  return (
    <OrganizationsSlugTeamsTeamId
      activeOrganization={activeOrganization}
      canUpdateTeam={canUpdateTeam}
      currentUserId={session.user.id}
      team={team}
      teamMembers={teamMembers}
    />
  );
};

export default OrganizationsSlugTeamsTeamIdPage;
