import { cookies } from "next/headers";

import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarDashboardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarDashboardPage = async ({
  searchParams,
}: ToolbarDashboardPageProps) => {
  const [cookieStore, { organization = "" }] = await Promise.all([
    cookies(),
    searchParams,
  ]);

  const organizations = await getOrganizations({
    headers: { cookie: cookieStore.toString() },
  });

  return (
    <MenusOrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarDashboardPage;
