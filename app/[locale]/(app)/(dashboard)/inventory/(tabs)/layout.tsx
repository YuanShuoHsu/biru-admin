import { SWRConfig } from "swr";

import InventoryTabs from "./InventoryTabs";

import { getDefaultMemberRoleFallback } from "@/utils/session";

const InventoryTabsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <>
    <SWRConfig value={{ fallback: await getDefaultMemberRoleFallback() }}>
      <InventoryTabs />
    </SWRConfig>
    {children}
  </>
);

export default InventoryTabsLayout;
