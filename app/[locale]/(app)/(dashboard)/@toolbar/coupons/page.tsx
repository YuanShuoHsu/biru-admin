import OrganizationSelect from "@/components/OrganizationSelect";

import { getSession, listOrganizations } from "@/utils/session";

interface ToolbarCouponsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarCouponsPage = async ({
  searchParams,
}: ToolbarCouponsPageProps) => {
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

export default ToolbarCouponsPage;
