import { cookies } from "next/headers";

import { Stack } from "@mui/material";

import EcpayAttentionButton from "@/components/EcpayAttentionButton";
import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarOrdersListPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersListPage = async ({
  searchParams,
}: ToolbarOrdersListPageProps) => {
  const [cookieStore, { organization = "" }] = await Promise.all([
    cookies(),
    searchParams,
  ]);

  const { data: organizations } = await authClient.organization.list({
    fetchOptions: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  });

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <EcpayAttentionButton organizationSlug={organization} />
      <OrganizationSelect
        organizations={organizations || []}
        organizationSlug={organization}
      />
    </Stack>
  );
};

export default ToolbarOrdersListPage;
