import PlatformAdminGate from "@/components/PlatformAdminGate";

const PointsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default PointsLayout;
