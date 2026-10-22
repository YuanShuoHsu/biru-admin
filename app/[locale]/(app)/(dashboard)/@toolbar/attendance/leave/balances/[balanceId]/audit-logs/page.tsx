import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarLeaveBalanceAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarLeaveBalanceAuditLogsPage = async ({
  searchParams,
}: ToolbarLeaveBalanceAuditLogsPageProps) => {
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

export default ToolbarLeaveBalanceAuditLogsPage;
