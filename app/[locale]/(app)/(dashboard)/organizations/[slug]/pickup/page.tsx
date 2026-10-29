import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import OrganizationsSlugPickup from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import { getOrganization, hasRolePermission } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

interface OrganizationsSlugPickupPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugPickupPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("pickup.label") };
};

const OrganizationsSlugPickupPage = async ({
  params,
}: OrganizationsSlugPickupPageProps) => {
  const { slug } = await params;

  const [
    { data, error: fullOrganizationError },
    { data: organization, error },
    session,
  ] = await Promise.all([
    settle(getFullOrganization(decodeURIComponent(slug))),
    settle(getOrganization(decodeURIComponent(slug))),
    getSession(),
  ]);

  if (
    fullOrganizationError?.status === 400 ||
    fullOrganizationError?.status === 403 ||
    error?.status === 404
  )
    notFound();
  if (fullOrganizationError || error) return <ErrorAlert />;
  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  const canUpdatePickup = hasRolePermission(currentUserRole, {
    organization: ["update"],
  });

  return (
    <OrganizationsSlugPickup
      canUpdatePickup={canUpdatePickup}
      organization={organization}
    />
  );
};

export default OrganizationsSlugPickupPage;
