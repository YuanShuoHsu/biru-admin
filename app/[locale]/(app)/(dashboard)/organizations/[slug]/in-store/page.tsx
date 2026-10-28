import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugInStore from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { settle } from "@/utils/fetcher";
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

  const [
    { data, error: fullOrganizationError },
    { data: organization, error: organizationError },
    session,
  ] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug },
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
    settle(getOrganization(organizationSlug)),
    getSession(),
  ]);

  if (
    fullOrganizationError?.status === 400 ||
    fullOrganizationError?.status === 403 ||
    organizationError?.status === 404
  )
    notFound();
  if (fullOrganizationError || organizationError) return <ErrorAlert />;
  if (!data) notFound();

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
