import { cookies } from "next/headers";

import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarMenusSectionsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusSectionsPage = async ({
  searchParams,
}: ToolbarMenusSectionsPageProps) => {
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

export default ToolbarMenusSectionsPage;
