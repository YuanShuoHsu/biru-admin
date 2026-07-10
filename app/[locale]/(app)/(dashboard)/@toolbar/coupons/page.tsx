import { cookies } from "next/headers";

import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarCouponsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarCouponsPage = async ({
  searchParams,
}: ToolbarCouponsPageProps) => {
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

export default ToolbarCouponsPage;
