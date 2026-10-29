import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import OrganizationsSlugPickup from ".";

import type { Locale } from "@/i18n/routing";

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

  const [data, organization, session] = await Promise.all([
    getFullOrganization(decodeURIComponent(slug)),
    getOrganization(decodeURIComponent(slug)),
    getSession(),
  ]);

  if (!data || !organization) notFound();

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
