import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarSuppliersPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarSuppliersPage = async ({
  searchParams,
}: ToolbarSuppliersPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarSuppliersPage;
