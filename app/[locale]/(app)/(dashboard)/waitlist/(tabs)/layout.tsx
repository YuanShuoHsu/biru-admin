"use client";

import WaitlistControls from "../WaitlistControls";

import RouteTabs from "@/components/RouteTabs";

const WaitlistTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <WaitlistControls />
    <RouteTabs
      ariaLabel="waitlist tabs"
      tabs={[{ path: "/waitlist/board" }, { path: "/waitlist/list" }]}
    />
    {children}
  </>
);

export default WaitlistTabsLayout;
