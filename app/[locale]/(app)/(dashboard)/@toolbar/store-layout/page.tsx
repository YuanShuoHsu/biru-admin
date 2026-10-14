import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarStoreLayoutPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarStoreLayoutPage = async ({
  searchParams,
}: ToolbarStoreLayoutPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarStoreLayoutPage;
