import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarLeaveTypeAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarLeaveTypeAuditLogsPage = async ({
  searchParams,
}: ToolbarLeaveTypeAuditLogsPageProps) => {
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

export default ToolbarLeaveTypeAuditLogsPage;
