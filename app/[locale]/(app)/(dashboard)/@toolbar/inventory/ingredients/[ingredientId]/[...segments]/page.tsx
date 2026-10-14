import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarIngredientSegmentsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarIngredientSegmentsPage = async ({
  searchParams,
}: ToolbarIngredientSegmentsPageProps) => {
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

export default ToolbarIngredientSegmentsPage;
