import OrderOrganizationTextField from "@/components/OrderOrganizationTextField";

import { getOrganizations } from "@/utils/organizations";

interface ToolbarOrderModePageProps {
  params: Promise<{ mode: string }>;
}

const ToolbarOrderModePage = async ({ params }: ToolbarOrderModePageProps) => {
  const { mode } = await params;

  const organizations = await getOrganizations();

  return (
    <OrderOrganizationTextField
      mode={mode}
      organizations={organizations}
      organizationSlug=""
    />
  );
};

export default ToolbarOrderModePage;
