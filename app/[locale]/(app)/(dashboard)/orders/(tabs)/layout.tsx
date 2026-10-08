"use client";

import RouteTabs from "@/components/RouteTabs";

const OrdersTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <RouteTabs
      ariaLabel="orders tabs"
      tabs={[{ path: "/orders/board" }, { path: "/orders/list" }]}
    />
    {children}
  </>
);

export default OrdersTabsLayout;
