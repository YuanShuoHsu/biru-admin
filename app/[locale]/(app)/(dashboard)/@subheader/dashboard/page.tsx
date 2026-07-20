import DashboardRangeToggle from "./DashboardRangeToggle";

import { resolveDashboardRange } from "@/app/[locale]/(app)/(dashboard)/dashboard/definitions";

import { Stack } from "@mui/material";

interface SubheaderDashboardPageProps {
  searchParams: Promise<{ organization?: string; range?: string }>;
}

const SubheaderDashboardPage = async ({
  searchParams,
}: SubheaderDashboardPageProps) => {
  const { organization = "", range: rangeParam } = await searchParams;

  const range = resolveDashboardRange(rangeParam);

  return (
    <Stack
      direction="row"
      justifyContent={{ sm: "flex-end" }}
      alignItems="center"
    >
      <DashboardRangeToggle organizationSlug={organization} range={range} />
    </Stack>
  );
};

export default SubheaderDashboardPage;
