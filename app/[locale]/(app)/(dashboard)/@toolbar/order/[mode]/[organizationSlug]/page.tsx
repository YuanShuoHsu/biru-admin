import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarOrderModeOrganizationSlugPageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugPage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugPageProps) => {
  const { mode, organizationSlug } = await params;

  const organizations = await getOrganizations();

  return (
    <OrderOrganizationTextField
      mode={mode}
      organizations={organizations}
      organizationSlug={organizationSlug}
    />
  );
};

export default ToolbarOrderModeOrganizationSlugPage;
