import RouterBreadcrumbs from "@/components/RouterBreadcrumbs";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface BreadcrumbOrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ organizationSlug: string }>;
}

const BreadcrumbOrderModeOrganizationSlugCheckoutPage = async ({
  params,
}: BreadcrumbOrderModeOrganizationSlugCheckoutPageProps) => {
  const { organizationSlug } = await params;

  const organization = await fetcher<OrganizationResponse>(
    `/api/organizations/${organizationSlug}`,
  ).catch(() => null);

  return <RouterBreadcrumbs organizationName={organization?.name || ""} />;
};

export default BreadcrumbOrderModeOrganizationSlugCheckoutPage;
