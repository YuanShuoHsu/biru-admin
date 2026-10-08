"use client";

import RouteTabs from "@/components/RouteTabs";

const OrdersTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <RouteTabs
      ariaLabel="orders tabs"
      tabs={[{ path: "/orders/list" }, { path: "/orders/board" }]}
    />
    {children}
  </>
);

export default OrdersTabsLayout;
