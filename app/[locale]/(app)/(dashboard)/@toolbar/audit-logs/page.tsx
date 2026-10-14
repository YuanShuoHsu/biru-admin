import OrganizationSelect from "@/components/OrganizationSelect";

import { getSession, listOrganizations } from "@/utils/session";

interface ToolbarAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarAuditLogsPage = async ({
  searchParams,
}: ToolbarAuditLogsPageProps) => {
  const { organization = "" } = await searchParams;

  const [session, organizations] = await Promise.all([
    getSession(),
    listOrganizations(),
  ]);

  if (session?.user?.role === "admin") return null;

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarAuditLogsPage;
