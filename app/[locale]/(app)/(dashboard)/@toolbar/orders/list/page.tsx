import EcpayAttentionButton from "@/components/EcpayAttentionButton";
import InvoicePrinterStatusChip from "@/components/InvoicePrinterStatusChip";
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
      <OrganizationSelect
        organizations={organizations}
        organizationSlug={organization}
      />
    </>
  );
};

export default ToolbarOrdersListPage;
