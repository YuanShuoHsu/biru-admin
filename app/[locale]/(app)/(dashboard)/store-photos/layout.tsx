import PlatformAdminGate from "@/components/PlatformAdminGate";

const StorePhotosLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default StorePhotosLayout;
