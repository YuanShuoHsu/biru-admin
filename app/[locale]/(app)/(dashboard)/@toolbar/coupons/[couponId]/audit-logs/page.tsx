import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarCouponAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarCouponAuditLogsPage = async ({
  searchParams,
}: ToolbarCouponAuditLogsPageProps) => {
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

export default ToolbarCouponAuditLogsPage;
