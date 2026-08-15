import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugTeams from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission } from "@/utils/organizations";

interface OrganizationsSlugTeamsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugTeamsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("organizations.teams.label") };
};

const OrganizationsSlugTeamsPage = async ({
  params,
}: OrganizationsSlugTeamsPageProps) => {
  const [cookieStore, { locale, slug }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const cookieHeader = cookieStore.toString();

  const [{ data }, { data: session }] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: { cookie: cookieHeader } },
    }),
    authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: cookieHeader,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    }),
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
      activeOrganization={{ ...data, teams: data.teams.toReversed() }}
      canCreateTeam={canCreateTeam}
      canDeleteTeam={canDeleteTeam}
      canUpdateTeam={canUpdateTeam}
    />
  );
};

export default OrganizationsSlugTeamsPage;
