import RouteTabs from "@/components/RouteTabs";

const PointsTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <RouteTabs
      ariaLabel="points tabs"
      tabs={[{ path: "/points/settings" }, { path: "/points/reports" }]}
    />
    {children}
  </>
);

export default PointsTabsLayout;
