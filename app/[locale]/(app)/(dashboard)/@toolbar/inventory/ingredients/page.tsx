import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarIngredientsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarIngredientsPage = async ({
  searchParams,
}: ToolbarIngredientsPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarIngredientsPage;
