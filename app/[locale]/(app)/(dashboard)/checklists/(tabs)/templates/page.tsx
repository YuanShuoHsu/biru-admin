import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import ChecklistTemplates from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

interface ChecklistTemplatesPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: ChecklistTemplatesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tChecklists = await getTranslations({
    locale,
    namespace: "checklists",
  });

  return { title: tChecklists("templates.label") };
};

const ChecklistTemplatesPage = async ({
  params,
  searchParams,
}: ChecklistTemplatesPageProps) => {
  const [{ locale }, { organization }] = await Promise.all([
    params,
    searchParams,
  ]);

  const selectedOrganization = await getResolvedAdminOrganization(organization);
  if (!selectedOrganization) notFound();

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/checklists/templates?${params.toString()}`, locale });
  }

  const memberRole = await getMemberRole(selectedOrganization.id);
  if (!hasRolePermission(memberRole, { organization: ["update"] })) notFound();

  return (
    <ChecklistTemplates
      key={selectedOrganization.slug}
      organizationSlug={selectedOrganization.slug}
    />
  );
};

export default ChecklistTemplatesPage;
