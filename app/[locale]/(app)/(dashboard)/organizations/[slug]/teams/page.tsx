import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import OrganizationsSlugTeams from ".";

import type { Locale } from "@/i18n/routing";

import { hasRolePermission, sortByCreatedAtDesc } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

interface OrganizationsSlugTeamsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugTeamsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("teams.label") };
};

const OrganizationsSlugTeamsContent = async ({
  params,
}: OrganizationsSlugTeamsPageProps) => {
  const { slug } = await params;

  const [data, session] = await Promise.all([
    getFullOrganization(decodeURIComponent(slug)),
    getSession(),
  ]);

  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  const canCreateTeam = hasRolePermission(currentUserRole, {
    team: ["create"],
  });
  const canDeleteTeam = hasRolePermission(currentUserRole, {
    team: ["delete"],
  });
  const canUpdateTeam = hasRolePermission(currentUserRole, {
    team: ["update"],
  });

  return (
    <OrganizationsSlugTeams
      activeOrganization={{ ...data, teams: sortByCreatedAtDesc(data.teams) }}
      canCreateTeam={canCreateTeam}
      canDeleteTeam={canDeleteTeam}
      canUpdateTeam={canUpdateTeam}
    />
  );
};

const OrganizationsSlugTeamsPage = (props: OrganizationsSlugTeamsPageProps) => (
  <Suspense fallback={<OrganizationsSlugTeams loading />}>
    <OrganizationsSlugTeamsContent {...props} />
  </Suspense>
);

export default OrganizationsSlugTeamsPage;
