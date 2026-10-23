import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface OrganizationSelectToolbarProps {
  readOnly?: boolean;
  searchParams: Promise<{ organization?: string }>;
}

const OrganizationSelectToolbar = async ({
  readOnly,
  searchParams,
}: OrganizationSelectToolbarProps) => {
  const [{ organization = "" }, organizations] = await Promise.all([
    searchParams,
    listOrganizations(),
  ]);

  return (
    <OrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
      readOnly={readOnly}
    />
  );
};

export default OrganizationSelectToolbar;
