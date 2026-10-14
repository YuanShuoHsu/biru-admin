import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarMenusModifierGroupsSegmentsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusModifierGroupsSegmentsPage = async ({
  searchParams,
}: ToolbarMenusModifierGroupsSegmentsPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
      readOnly
    />
  );
};

export default ToolbarMenusModifierGroupsSegmentsPage;
