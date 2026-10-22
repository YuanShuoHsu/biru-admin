import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarPayslipAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarPayslipAuditLogsPage = async ({
  searchParams,
}: ToolbarPayslipAuditLogsPageProps) => {
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

export default ToolbarPayslipAuditLogsPage;
