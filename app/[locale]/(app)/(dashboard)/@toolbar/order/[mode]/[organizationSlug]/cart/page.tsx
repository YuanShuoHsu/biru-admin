import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarOrderModeOrganizationSlugCartPageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugCartPage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugCartPageProps) => {
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

export default ToolbarOrderModeOrganizationSlugCartPage;
