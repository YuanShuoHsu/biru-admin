import OrderTicketPrinterStatusChips from "@/components/OrderTicketPrinterStatusChips";
import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";
import PrepEstimateChip from "@/components/PrepEstimateChip";

interface ToolbarOrdersKitchenPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersKitchenPage = async ({
  searchParams,
}: ToolbarOrdersKitchenPageProps) => {
  const { organization = "" } = await searchParams;

  return (
    <>
      <PrepEstimateChip organizationSlug={organization} />
      <OrderTicketPrinterStatusChips organizationSlug={organization} />
      <OrganizationSelectToolbar searchParams={searchParams} />
    </>
  );
};

export default ToolbarOrdersKitchenPage;
