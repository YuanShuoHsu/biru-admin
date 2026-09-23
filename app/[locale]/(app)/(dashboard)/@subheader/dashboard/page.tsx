import DashboardRangeToggle from "./DashboardRangeToggle";
import { StyledStack } from "./styled";

import { resolveDashboardRange } from "@/app/[locale]/(app)/(dashboard)/dashboard/definitions";

interface SubheaderDashboardPageProps {
  searchParams: Promise<{ organization?: string; range?: string }>;
}

const SubheaderDashboardPage = async ({
  searchParams,
}: SubheaderDashboardPageProps) => {
  const { organization = "", range: rangeParam } = await searchParams;

  const range = resolveDashboardRange(rangeParam);

  return (
    <StyledStack direction="row">
      <DashboardRangeToggle organizationSlug={organization} range={range} />
    </StyledStack>
  );
};

export default SubheaderDashboardPage;
