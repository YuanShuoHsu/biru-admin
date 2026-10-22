import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarParentalReturnAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarParentalReturnAuditLogsPage = async ({
  searchParams,
}: ToolbarParentalReturnAuditLogsPageProps) => {
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

export default ToolbarParentalReturnAuditLogsPage;
