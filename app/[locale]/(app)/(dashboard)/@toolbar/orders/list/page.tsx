import EcpayAttentionButton from "@/components/EcpayAttentionButton";
import InvoicePrinterStatusChip from "@/components/InvoicePrinterStatusChip";
import OrderTicketPrinterStatusChips from "@/components/OrderTicketPrinterStatusChips";
import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarOrdersListPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersListPage = async ({
  searchParams,
}: ToolbarOrdersListPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <>
      <EcpayAttentionButton organizationSlug={organization} />
      <InvoicePrinterStatusChip organizationSlug={organization} />
      <OrderTicketPrinterStatusChips organizationSlug={organization} />
      <OrganizationSelect
        organizations={organizations}
        organizationSlug={organization}
      />
    </>
  );
};

export default ToolbarOrdersListPage;
