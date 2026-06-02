import OrderOrganizationSlugSelect from "@/components/OrderOrganizationSlugSelect";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const ToolbarOrderModePage = async () => {
  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <OrderOrganizationSlugSelect
      organizations={organizations}
      organizationSlug=""
    />
  );
};

export default ToolbarOrderModePage;
