import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarOrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugCompletePage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugCompletePageProps) => {
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

export default ToolbarOrderModeOrganizationSlugCompletePage;
