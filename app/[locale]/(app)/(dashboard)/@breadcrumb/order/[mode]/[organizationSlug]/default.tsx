import RouterBreadcrumbs from "@/components/RouterBreadcrumbs";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface BreadcrumbOrderModeOrganizationSlugDefaultProps {
  params: Promise<{ organizationSlug: string }>;
}

const BreadcrumbOrderModeOrganizationSlugDefault = async ({
  params,
}: BreadcrumbOrderModeOrganizationSlugDefaultProps) => {
  const { organizationSlug } = await params;

  const organization = await fetcher<OrganizationResponse>(
    `/api/organizations/${organizationSlug}`,
  );

  return <RouterBreadcrumbs organizationName={organization.name} />;
};

export default BreadcrumbOrderModeOrganizationSlugDefault;
