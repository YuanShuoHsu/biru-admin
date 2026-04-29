import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MembersContent from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface MembersPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const MembersPage = async ({ params }: MembersPageProps) => {
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
    <MembersContent
      id={data.id}
      members={data.members.toReversed()}
      slug={slug}
      teams={data.teams.toReversed()}
    />
  );
};

export default MembersPage;
