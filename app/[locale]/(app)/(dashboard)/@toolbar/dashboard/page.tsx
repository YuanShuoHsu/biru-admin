import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarDashboardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarDashboardPage = async ({
  searchParams,
}: ToolbarDashboardPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarDashboardPage;
