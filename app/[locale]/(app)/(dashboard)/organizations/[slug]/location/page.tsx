import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import OrganizationsSlugLocation from ".";

import type { Locale } from "@/i18n/routing";

import { hasRolePermission } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

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
  const { slug } = await params;

  const [data, session] = await Promise.all([
    getFullOrganization(decodeURIComponent(slug)),
    getSession(),
  ]);

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
