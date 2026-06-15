import OrderOrganizationSlugSelect from "@/components/OrderOrganizationSlugSelect";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarOrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugCheckoutPage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugCheckoutPageProps) => {
  const { organizationSlug } = await params;

  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <OrderOrganizationSlugSelect
      organizations={organizations}
      organizationSlug={organizationSlug}
    />
  );
};

export default ToolbarOrderModeOrganizationSlugCheckoutPage;
