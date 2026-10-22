import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarLeaveCaseAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarLeaveCaseAuditLogsPage = async ({
  searchParams,
}: ToolbarLeaveCaseAuditLogsPageProps) => {
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

export default ToolbarLeaveCaseAuditLogsPage;
