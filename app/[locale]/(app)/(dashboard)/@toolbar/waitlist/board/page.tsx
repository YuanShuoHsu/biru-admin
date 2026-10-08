import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarWaitlistBoardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarWaitlistBoardPage = async ({
  searchParams,
}: ToolbarWaitlistBoardPageProps) => {
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
    <OrganizationSelect
      organizations={organizations || []}
      organizationSlug={organization}
    />
  );
};

export default ToolbarWaitlistBoardPage;
