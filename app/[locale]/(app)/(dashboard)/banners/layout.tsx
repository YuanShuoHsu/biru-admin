import PlatformAdminGate from "@/components/PlatformAdminGate";

const BannersLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default BannersLayout;
