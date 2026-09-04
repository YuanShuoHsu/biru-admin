import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

import { getSession } from "@/utils/session";

interface ToolbarIngredientsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarIngredientsPage = async ({
  searchParams,
}: ToolbarIngredientsPageProps) => {
  const [cookieStore, { organization = "" }] = await Promise.all([
    cookies(),
    searchParams,
  ]);

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
    },
  };

  const [session, { data: organizations }] = await Promise.all([
    getSession(),
    authClient.organization.list({ fetchOptions }),
  ]);

  if (session?.user?.role === "admin") return null;

  return (
    <OrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
    />
  );
};

export default ToolbarIngredientsPage;
