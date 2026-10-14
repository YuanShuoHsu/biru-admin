import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarWaitlistTicketAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarWaitlistTicketAuditLogsPage = async ({
  searchParams,
}: ToolbarWaitlistTicketAuditLogsPageProps) => {
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

export default ToolbarWaitlistTicketAuditLogsPage;
