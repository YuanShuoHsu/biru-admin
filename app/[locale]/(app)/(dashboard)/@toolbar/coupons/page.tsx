import { cookies } from "next/headers";

import MenusOrganizationSelect from "@/components/MenusOrganizationSelect";

import { authClient } from "@/lib/auth-client";

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

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const [{ data: session }, { data: organizations }] = await Promise.all([
    authClient.getSession({ fetchOptions }),
    authClient.organization.list({ fetchOptions }),
  ]);

  if (session?.user?.role === "admin") return null;

  return (
    <MenusOrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
    />
  );
};

export default ToolbarCouponsPage;
