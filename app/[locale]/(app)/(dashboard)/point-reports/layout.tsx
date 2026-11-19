import PlatformAdminGate from "@/components/PlatformAdminGate";

const PointReportsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default PointReportsLayout;
