import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugDineIn from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsSlugDineInPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugDineInPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("dineIn.label") };
};

const OrganizationsSlugDineInPage = async ({
  params,
}: OrganizationsSlugDineInPageProps) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const organizationSlug = decodeURIComponent(slug);

  const [{ data }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug },
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
    getSession(),
  ]);

  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  if (!hasRolePermission(currentUserRole, { organization: ["update"] }))
    notFound();

  return <OrganizationsSlugDineIn organizationSlug={organizationSlug} />;
};

export default OrganizationsSlugDineInPage;
