import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import TeamsContent from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface TeamsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const TeamsPage = async ({ params }: TeamsPageProps) => {
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
    <TeamsContent
      id={data.id}
      members={data.members}
      slug={slug}
      teams={data.teams.toReversed()}
    />
  );
};

export default TeamsPage;
