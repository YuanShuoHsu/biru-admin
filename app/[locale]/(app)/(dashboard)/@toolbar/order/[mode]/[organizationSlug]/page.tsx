import OrderOrganizationSlugSelect from "@/components/OrderOrganizationSlugSelect";

interface ToolbarOrderModeOrganizationSlugPageProps {
  params: Promise<{ organizationSlug: string }>;
}

const ToolbarOrderModeOrganizationSlugPage = async ({
  params,
}: ToolbarOrderModeOrganizationSlugPageProps) => {
  const { organizationSlug } = await params;

  return <OrderOrganizationSlugSelect organizationSlug={organizationSlug} />;
};

export default ToolbarOrderModeOrganizationSlugPage;
