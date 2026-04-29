import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import InvitationsContent from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface InvitationsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const InvitationsPage = async ({ params }: InvitationsPageProps) => {
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
    <InvitationsContent
      id={data.id}
      invitations={pendingInvitations}
      members={data.members}
      teams={data.teams}
    />
  );
};

export default InvitationsPage;
