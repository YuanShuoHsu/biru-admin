import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarAttendanceSegmentsPageProps {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarAttendanceSegmentsPage = async ({
  params,
  searchParams,
}: ToolbarAttendanceSegmentsPageProps) => {
  const [{ segments }, { organization = "" }] = await Promise.all([
    params,
    searchParams,
  ]);

  const organizations = await listOrganizations();

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
      readOnly={segments.at(-1) === "audit-logs"}
    />
  );
};

export default ToolbarAttendanceSegmentsPage;
