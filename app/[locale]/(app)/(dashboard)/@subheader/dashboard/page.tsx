// https://nextjs.org/docs/app/guides/instant-navigation

import { Suspense } from "react";

import DashboardRangeToggle from "./DashboardRangeToggle";
import { StyledStack } from "./styled";

const SubheaderDashboardPage = () => (
  <StyledStack direction="row">
    <Suspense>
      <DashboardRangeToggle />
    </Suspense>
  </StyledStack>
);

export default SubheaderDashboardPage;
