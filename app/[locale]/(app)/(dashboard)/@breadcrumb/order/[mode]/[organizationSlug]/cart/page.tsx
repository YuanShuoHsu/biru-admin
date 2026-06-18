import RouterBreadcrumbs from "@/components/RouterBreadcrumbs";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface BreadcrumbOrderModeOrganizationSlugCartPageProps {
  params: Promise<{ organizationSlug: string }>;
}

const BreadcrumbOrderModeOrganizationSlugCartPage = async ({
  params,
}: BreadcrumbOrderModeOrganizationSlugCartPageProps) => {
  const { organizationSlug } = await params;

  const organization = await fetcher<OrganizationResponse>(
    `/api/organizations/${organizationSlug}`,
  ).catch(() => null);

  return <RouterBreadcrumbs organizationName={organization?.name || ""} />;
};

export default BreadcrumbOrderModeOrganizationSlugCartPage;
