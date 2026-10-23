import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";

import { getSession } from "@/utils/session";

interface OrganizationSelectNonAdminToolbarProps {
  searchParams: Promise<{ organization?: string }>;
}

const OrganizationSelectNonAdminToolbar = async ({
  searchParams,
}: OrganizationSelectNonAdminToolbarProps) => {
  const session = await getSession();

  if (session?.user?.role === "admin") return null;

  return <OrganizationSelectToolbar searchParams={searchParams} />;
};

export default OrganizationSelectNonAdminToolbar;
