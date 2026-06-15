import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const ToolbarOrderModePage = async () => {
  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <OrderOrganizationTextField
      organizations={organizations}
      organizationSlug=""
    />
  );
};

export default ToolbarOrderModePage;
