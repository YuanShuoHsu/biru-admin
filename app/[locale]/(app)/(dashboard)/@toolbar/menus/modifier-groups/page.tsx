import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarMenusModifierGroupsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenusModifierGroupsPage = async ({
  searchParams,
}: ToolbarMenusModifierGroupsPageProps) => {
  const [cookieStore, { organization = "" }] = await Promise.all([
    cookies(),
    searchParams,
  ]);

  const { data: organizations } = await authClient.organization.list({
    fetchOptions: {
      headers: {
        cookie: cookieStore.toString(),
        origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
      },
    },
  });

  return (
    <OrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
    />
  );
};

export default ToolbarMenusModifierGroupsPage;
