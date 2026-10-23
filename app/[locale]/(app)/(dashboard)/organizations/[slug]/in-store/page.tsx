import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugInStore from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getOrganization, hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsSlugInStorePageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugInStorePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("inStore.label") };
};

const OrganizationsSlugInStorePage = async ({
  params,
}: OrganizationsSlugInStorePageProps) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const organizationSlug = decodeURIComponent(slug);

  const [{ data }, organization, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug },
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
    getOrganization(organizationSlug),
    getSession(),
  ]);

  if (!data || !organization) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  if (!hasRolePermission(currentUserRole, { organization: ["update"] }))
    notFound();

  return (
    <OrganizationsSlugInStore
      organization={organization}
      organizationSlug={organizationSlug}
    />
  );
};

export default OrganizationsSlugInStorePage;
