import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import OrganizationsSlugSpecialHours from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

interface OrganizationsSlugSpecialHoursPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugSpecialHoursPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("specialHours.label") };
};

const OrganizationsSlugSpecialHoursPage = async ({
  params,
}: OrganizationsSlugSpecialHoursPageProps) => {
  const { slug } = await params;

  const organizationSlug = decodeURIComponent(slug);

  const [{ data, error }, session] = await Promise.all([
    settle(getFullOrganization(organizationSlug)),
    getSession(),
  ]);

  if (error?.status === 400 || error?.status === 403) notFound();
  if (error) return <ErrorAlert />;
  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  if (!hasRolePermission(currentUserRole, { organization: ["update"] }))
    notFound();

  return <OrganizationsSlugSpecialHours organizationSlug={organizationSlug} />;
};

export default OrganizationsSlugSpecialHoursPage;
