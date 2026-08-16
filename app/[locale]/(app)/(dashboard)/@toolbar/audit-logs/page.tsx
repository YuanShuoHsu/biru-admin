import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarAuditLogsPage = async ({
  searchParams,
}: ToolbarAuditLogsPageProps) => {
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
    <OrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
    />
  );
};

export default ToolbarAuditLogsPage;
