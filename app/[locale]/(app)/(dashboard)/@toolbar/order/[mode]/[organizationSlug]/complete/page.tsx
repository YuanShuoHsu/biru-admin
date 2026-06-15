import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarOrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugCompletePage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugCompletePageProps) => {
  const { organizationSlug } = await params;

  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <OrderOrganizationTextField
      organizations={organizations}
      organizationSlug={organizationSlug}
    />
  );
};

export default ToolbarOrderModeOrganizationSlugCompletePage;
