"use client";

import RouteTabs from "@/components/RouteTabs";

interface OrdersTabsLayoutProps {
  children: React.ReactNode;
}

const OrdersTabsLayout = ({ children }: OrdersTabsLayoutProps) => (
  <>
    <RouteTabs
      ariaLabel="orders tabs"
      tabs={[{ path: "/orders/list" }, { path: "/orders/board" }]}
    />
    {children}
  </>
);

export default OrdersTabsLayout;
