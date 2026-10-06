import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarWaitlistPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarWaitlistPage = async ({
  searchParams,
}: ToolbarWaitlistPageProps) => {
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

export default ToolbarWaitlistPage;
