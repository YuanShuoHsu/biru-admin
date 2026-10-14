import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarAttendanceSegmentsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarAttendanceSegmentsPage = async ({
  searchParams,
}: ToolbarAttendanceSegmentsPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarAttendanceSegmentsPage;
