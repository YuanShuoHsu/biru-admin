import InvoicePrinterStatusChip from "@/components/InvoicePrinterStatusChip";
import OrderTicketPrinterStatusChips from "@/components/OrderTicketPrinterStatusChips";
import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";

interface ToolbarOrdersBoardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersBoardPage = async ({
  searchParams,
}: ToolbarOrdersBoardPageProps) => {
  const { organization = "" } = await searchParams;

  return (
    <>
      <InvoicePrinterStatusChip organizationSlug={organization} />
      <OrderTicketPrinterStatusChips organizationSlug={organization} />
      <OrganizationSelectToolbar searchParams={searchParams} />
    </>
  );
};

export default ToolbarOrdersBoardPage;
