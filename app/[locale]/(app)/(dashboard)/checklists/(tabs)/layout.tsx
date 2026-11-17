import { SWRConfig } from "swr";

import ChecklistsTabs from "./ChecklistsTabs";

import { getDefaultMemberRoleFallback } from "@/utils/session";

const ChecklistsTabsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <>
    <SWRConfig value={{ fallback: await getDefaultMemberRoleFallback() }}>
      <ChecklistsTabs />
    </SWRConfig>
    {children}
  </>
);

export default ChecklistsTabsLayout;
