import InvoicePrinterStatusChip from "@/components/InvoicePrinterStatusChip";
import OrganizationSelect from "@/components/OrganizationSelect";

import { listOrganizations } from "@/utils/session";

interface ToolbarOrdersBoardPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarOrdersBoardPage = async ({
  searchParams,
}: ToolbarOrdersBoardPageProps) => {
  const { organization = "" } = await searchParams;

  const organizations = await listOrganizations();

  return (
    <>
      <InvoicePrinterStatusChip organizationSlug={organization} />
      <OrganizationSelect
        organizations={organizations}
        organizationSlug={organization}
      />
    </>
  );
};

export default ToolbarOrdersBoardPage;
