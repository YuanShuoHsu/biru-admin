import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugMembers from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugMembersPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationsSlugMembersPage = async ({
  params,
}: OrganizationsSlugMembersPageProps) => {
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
    <OrganizationsSlugMembers
      activeOrganization={{
        ...data,
        members: data.members.toReversed(),
        teams: data.teams.toReversed(),
      }}
    />
  );
};

export default OrganizationsSlugMembersPage;
