import InvoicePrinterStatusChip from "@/components/InvoicePrinterStatusChip";
import OrderTicketPrinterStatusChips from "@/components/OrderTicketPrinterStatusChips";
import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";
import PrepEstimateChip from "@/components/PrepEstimateChip";

interface ToolbarOrdersBoardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersBoardPage = async ({
  searchParams,
}: ToolbarOrdersBoardPageProps) => {
  const { organization = "" } = await searchParams;

  return (
    <>
      <PrepEstimateChip organizationSlug={organization} />
      <InvoicePrinterStatusChip organizationSlug={organization} />
      <OrderTicketPrinterStatusChips organizationSlug={organization} />
      <OrganizationSelectToolbar searchParams={searchParams} />
    </>
  );
};

export default ToolbarOrdersBoardPage;
