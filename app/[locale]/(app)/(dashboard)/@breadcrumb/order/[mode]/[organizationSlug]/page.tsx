import RouterBreadcrumbs from "@/components/RouterBreadcrumbs";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface BreadcrumbOrderModeOrganizationSlugPageProps {
  params: Promise<{ organizationSlug: string }>;
}

const BreadcrumbOrderModeOrganizationSlugPage = async ({
  params,
}: BreadcrumbOrderModeOrganizationSlugPageProps) => {
  const { organizationSlug } = await params;

  const organization = await fetcher<OrganizationResponse>(
    `/api/organizations/${organizationSlug}`,
  );

  return <RouterBreadcrumbs organizationName={organization.name} />;
};

export default BreadcrumbOrderModeOrganizationSlugPage;
