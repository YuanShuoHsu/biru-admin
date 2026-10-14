import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarMenusSectionsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusSectionsPage = async ({
  searchParams,
}: ToolbarMenusSectionsPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarMenusSectionsPage;
