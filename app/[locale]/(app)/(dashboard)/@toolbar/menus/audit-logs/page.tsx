import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarMenuAuditLogsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarMenuAuditLogsPage = async ({
  searchParams,
}: ToolbarMenuAuditLogsPageProps) => {
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
      readOnly
    />
  );
};

export default ToolbarMenuAuditLogsPage;
