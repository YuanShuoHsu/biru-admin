import PlatformAdminGate from "@/components/PlatformAdminGate";

const QuantLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default QuantLayout;
