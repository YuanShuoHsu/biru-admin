import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarMenusModifierGroupsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusModifierGroupsPage = async ({
  searchParams,
}: ToolbarMenusModifierGroupsPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarMenusModifierGroupsPage;
