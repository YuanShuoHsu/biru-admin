import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugInvitations from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugInvitationsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationsSlugInvitationsPage = async ({
  params,
}: OrganizationsSlugInvitationsPageProps) => {
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

  const pendingInvitations = data.invitations
    .toReversed()
    .filter(({ status }) => status === "pending");

  return (
    <OrganizationsSlugInvitations
      id={data.id}
      invitations={pendingInvitations}
      members={data.members}
      teams={data.teams}
    />
  );
};

export default OrganizationsSlugInvitationsPage;
