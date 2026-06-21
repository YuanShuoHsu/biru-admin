import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarOrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugCompletePage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugCompletePageProps) => {
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

export default ToolbarOrderModeOrganizationSlugCompletePage;
