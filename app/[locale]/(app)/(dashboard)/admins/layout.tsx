import PlatformAdminGate from "@/components/PlatformAdminGate";

const AdminsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PlatformAdminGate />
    {children}
  </>
);

export default AdminsLayout;
