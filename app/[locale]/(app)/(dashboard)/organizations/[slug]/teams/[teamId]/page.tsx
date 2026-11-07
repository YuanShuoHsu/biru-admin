// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import OrganizationsSlugTeamsTeamId from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { ActiveOrganization, Team } from "@/types/organizations";

import { settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";
import { buildTeamMembers } from "@/utils/teams";

interface OrganizationsSlugTeamsTeamIdPageProps {
  params: Promise<{ locale: Locale; slug: string; teamId: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugTeamsTeamIdPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("teams.label") };
};

interface OrganizationsSlugTeamsTeamIdContentProps {
  activeOrganization: ActiveOrganization;
  canUpdateTeam: boolean;
  currentUserId: string;
  team: Team;
  teamMembers: ReturnType<typeof authClient.organization.listTeamMembers>;
}

const OrganizationsSlugTeamsTeamIdContent = async ({
  teamMembers: teamMembersResult,
  ...props
}: OrganizationsSlugTeamsTeamIdContentProps) => {
  const { data: teamMemberData, error: teamMembersError } =
    await teamMembersResult;

  if (
    teamMembersError &&
    teamMembersError.code !== "USER_IS_NOT_A_MEMBER_OF_THE_TEAM"
  )
    return <ErrorAlert />;

  const teamMembers = buildTeamMembers(
    teamMemberData || [],
    props.activeOrganization.members,
  );

  return <OrganizationsSlugTeamsTeamId {...props} teamMembers={teamMembers} />;
};

const OrganizationsSlugTeamsTeamIdPage = async ({
  params,
}: OrganizationsSlugTeamsTeamIdPageProps) => {
  const [cookieStore, { slug, teamId }] = await Promise.all([
    cookies(),
    params,
  ]);

  const cookieHeader = { cookie: cookieStore.toString() };

  const teamMembers = authClient.organization.listTeamMembers({
    query: { teamId },
    fetchOptions: { headers: cookieHeader },
  });
  const [{ data: activeOrganization, error: organizationError }, session] =
    await Promise.all([
      settle(getFullOrganization(decodeURIComponent(slug))),
      getSession(),
    ]);

  if (organizationError?.status === 400 || organizationError?.status === 403)
    notFound();
  if (organizationError) return <ErrorAlert />;
  if (!activeOrganization || !session?.user?.id) notFound();

  const team = activeOrganization.teams.find(({ id }) => id === teamId);
  if (!team) notFound();

  const currentUserRole = activeOrganization.members.find(
    ({ userId }) => userId === session.user.id,
  )?.role;

  const canUpdateTeam = hasRolePermission(currentUserRole, {
    team: ["update"],
  });

  return (
    <Suspense fallback={<OrganizationsSlugTeamsTeamId loading />}>
      <OrganizationsSlugTeamsTeamIdContent
        activeOrganization={activeOrganization}
        canUpdateTeam={canUpdateTeam}
        currentUserId={session.user.id}
        team={team}
        teamMembers={teamMembers}
      />
    </Suspense>
  );
};

export default OrganizationsSlugTeamsTeamIdPage;
