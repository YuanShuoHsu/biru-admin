import PlatformAdminGate from "@/components/PlatformAdminGate";

const PointSettingsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default PointSettingsLayout;
