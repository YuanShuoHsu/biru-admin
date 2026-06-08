import { cookies } from "next/headers";

import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface ToolbarMenusPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusPage = async ({ searchParams }: ToolbarMenusPageProps) => {
  const [cookieStore, { organization = "" }] = await Promise.all([
    cookies(),
    searchParams,
  ]);

  const organizations = await fetcher<OrganizationResponse[]>(
    "/api/organizations",
    { headers: { cookie: cookieStore.toString() } },
  ).catch(() => []);

  return (
    <MenusOrganizationSelect
      organizations={organizations}
      organizationSlug={organization}
    />
  );
};

export default ToolbarMenusPage;
