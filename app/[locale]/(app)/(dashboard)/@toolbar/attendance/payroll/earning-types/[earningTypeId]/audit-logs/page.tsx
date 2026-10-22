import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarEarningTypeAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarEarningTypeAuditLogsPage = async ({
  searchParams,
}: ToolbarEarningTypeAuditLogsPageProps) => {
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

export default ToolbarEarningTypeAuditLogsPage;
