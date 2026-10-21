import PlatformAdminGate from "@/components/PlatformAdminGate";

const StoreLayoutLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default StoreLayoutLayout;
