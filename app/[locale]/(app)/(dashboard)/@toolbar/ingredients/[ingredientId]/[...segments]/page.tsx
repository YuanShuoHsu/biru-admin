import { cookies } from "next/headers";

import OrganizationSelect from "@/components/OrganizationSelect";

import { authClient } from "@/lib/auth-client";

interface ToolbarIngredientSegmentsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarIngredientSegmentsPage = async ({
  searchParams,
}: ToolbarIngredientSegmentsPageProps) => {
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
      readOnly
    />
  );
};

export default ToolbarIngredientSegmentsPage;
