import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarHolidaySubstituteAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarHolidaySubstituteAuditLogsPage = async ({
  searchParams,
}: ToolbarHolidaySubstituteAuditLogsPageProps) => {
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

export default ToolbarHolidaySubstituteAuditLogsPage;
