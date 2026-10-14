import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarMenusSectionsSegmentsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusSectionsSegmentsPage = async ({
  searchParams,
}: ToolbarMenusSectionsSegmentsPageProps) => {
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

export default ToolbarMenusSectionsSegmentsPage;
