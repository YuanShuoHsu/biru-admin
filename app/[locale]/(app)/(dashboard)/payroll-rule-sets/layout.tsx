import PlatformAdminGate from "@/components/PlatformAdminGate";

const PayrollRuleSetsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default PayrollRuleSetsLayout;
