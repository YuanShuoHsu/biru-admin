import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarWaitlistBoardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarWaitlistBoardPage = async ({
  searchParams,
}: ToolbarWaitlistBoardPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarWaitlistBoardPage;
