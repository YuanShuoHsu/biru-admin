"use client";

import RouteTabs from "@/components/RouteTabs";

interface InventoryTabsLayoutProps {
  canViewInventory: boolean;
  canViewPurchasing: boolean;
  children: React.ReactNode;
}

const InventoryTabsLayout = ({
  canViewInventory,
  canViewPurchasing,
  children,
}: InventoryTabsLayoutProps) => (
  <>
    <RouteTabs
      ariaLabel="inventory tabs"
      tabs={[
        ...(canViewInventory ? [{ path: "/inventory/ingredients" }] : []),
        ...(canViewPurchasing ? [{ path: "/inventory/suppliers" }] : []),
      ]}
    />
    {children}
  </>
);

export default InventoryTabsLayout;
