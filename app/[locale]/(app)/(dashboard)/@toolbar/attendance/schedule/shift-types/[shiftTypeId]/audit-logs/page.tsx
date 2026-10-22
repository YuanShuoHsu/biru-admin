import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarShiftTypeAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarShiftTypeAuditLogsPage = async ({
  searchParams,
}: ToolbarShiftTypeAuditLogsPageProps) => {
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

export default ToolbarShiftTypeAuditLogsPage;
