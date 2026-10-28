import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugLocation from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsSlugLocationPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugLocationPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("location.label") };
};

const OrganizationsSlugLocationPage = async ({
  params,
}: OrganizationsSlugLocationPageProps) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const [{ data, error }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
    getSession(),
  ]);

  if (error?.status === 400 || error?.status === 403) notFound();
  if (error) return <ErrorAlert />;
  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  const canUpdateLocation = hasRolePermission(currentUserRole, {
    organization: ["update"],
  });

  return (
    <OrganizationsSlugLocation
      activeOrganization={data}
      canUpdateLocation={canUpdateLocation}
    />
  );
};

export default OrganizationsSlugLocationPage;
