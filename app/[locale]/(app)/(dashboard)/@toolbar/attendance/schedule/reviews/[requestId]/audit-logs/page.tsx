import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarAttendanceRequestAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarAttendanceRequestAuditLogsPage = async ({
  searchParams,
}: ToolbarAttendanceRequestAuditLogsPageProps) => {
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

export default ToolbarAttendanceRequestAuditLogsPage;
