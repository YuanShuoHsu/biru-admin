import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarMenuAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenuAuditLogsPage = async ({
  searchParams,
}: ToolbarMenuAuditLogsPageProps) => {
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

export default ToolbarMenuAuditLogsPage;
