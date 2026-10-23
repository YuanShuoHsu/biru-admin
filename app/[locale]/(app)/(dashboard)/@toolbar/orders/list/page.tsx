import EcpayAttentionButton from "@/components/EcpayAttentionButton";
import InvoicePrinterStatusChip from "@/components/InvoicePrinterStatusChip";
import OrderTicketPrinterStatusChips from "@/components/OrderTicketPrinterStatusChips";
import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";

interface ToolbarOrdersListPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersListPage = async ({
  searchParams,
}: ToolbarOrdersListPageProps) => {
  const { organization = "" } = await searchParams;

  return (
    <>
      <EcpayAttentionButton organizationSlug={organization} />
      <InvoicePrinterStatusChip organizationSlug={organization} />
      <OrderTicketPrinterStatusChips organizationSlug={organization} />
      <OrganizationSelectToolbar searchParams={searchParams} />
    </>
  );
};

export default ToolbarOrdersListPage;
