import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarWaitlistListPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarWaitlistListPage = async ({
  searchParams,
}: ToolbarWaitlistListPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarWaitlistListPage;
