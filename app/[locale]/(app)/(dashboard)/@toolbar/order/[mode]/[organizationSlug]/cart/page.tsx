import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarOrderModeOrganizationSlugCartPageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugCartPage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugCartPageProps) => {
  const { mode, organizationSlug } = await params;

  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <OrderOrganizationTextField
      mode={mode}
      organizations={organizations}
      organizationSlug={organizationSlug}
    />
  );
};

export default ToolbarOrderModeOrganizationSlugCartPage;
