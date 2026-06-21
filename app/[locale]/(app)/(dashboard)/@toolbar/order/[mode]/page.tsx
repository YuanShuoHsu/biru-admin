import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarOrderModePageProps {
  params: Promise<{ mode: string }>;
}

const ToolbarOrderModePage = async ({ params }: ToolbarOrderModePageProps) => {
  const { mode } = await params;

  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <OrderOrganizationTextField
      mode={mode}
      organizations={organizations}
      organizationSlug=""
    />
  );
};

export default ToolbarOrderModePage;
