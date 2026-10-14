import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarOrderAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrderAuditLogsPage = async ({
  searchParams,
}: ToolbarOrderAuditLogsPageProps) => {
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

export default ToolbarOrderAuditLogsPage;
