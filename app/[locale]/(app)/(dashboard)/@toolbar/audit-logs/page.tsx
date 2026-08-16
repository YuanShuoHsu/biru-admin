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

  const [{ data: organizations }, session] = await Promise.all([
    authClient.organization.list({ fetchOptions }),
    authClient.getSession({ fetchOptions }),
  ]);

  return (
    <OrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
      // 只有平台管理員讀得到平台層紀錄，給別人選只會被導回自己的店家
      platformOption={session.data?.user?.role === "admin"}
    />
  );
};

export default ToolbarAuditLogsPage;
