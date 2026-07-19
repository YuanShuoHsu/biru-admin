import { cookies } from "next/headers";

import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarOrdersPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersPage = async ({ searchParams }: ToolbarOrdersPageProps) => {
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
    <MenusOrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
    />
  );
};

export default ToolbarOrdersPage;
