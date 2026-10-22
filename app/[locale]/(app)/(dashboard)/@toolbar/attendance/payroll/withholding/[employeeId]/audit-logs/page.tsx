import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarTaxIdentityAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarTaxIdentityAuditLogsPage = async ({
  searchParams,
}: ToolbarTaxIdentityAuditLogsPageProps) => {
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

export default ToolbarTaxIdentityAuditLogsPage;
