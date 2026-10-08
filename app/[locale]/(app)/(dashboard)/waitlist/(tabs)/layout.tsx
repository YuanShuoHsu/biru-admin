"use client";

import RouteTabs from "@/components/RouteTabs";

const WaitlistTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <RouteTabs
      ariaLabel="waitlist tabs"
      tabs={[{ path: "/waitlist/list" }, { path: "/waitlist/board" }]}
    />
    {children}
  </>
);

export default WaitlistTabsLayout;
