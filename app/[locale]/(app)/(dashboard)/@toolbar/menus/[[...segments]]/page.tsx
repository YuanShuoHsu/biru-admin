import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarMenusPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusPage = async ({ searchParams }: ToolbarMenusPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
  ).catch(() => []);

  return (
    <MenusOrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarMenusPage;
