import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

import { getSession } from "@/utils/session";

interface ToolbarSuppliersPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarSuppliersPage = async ({
  searchParams,
}: ToolbarSuppliersPageProps) => {
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

export default ToolbarSuppliersPage;
