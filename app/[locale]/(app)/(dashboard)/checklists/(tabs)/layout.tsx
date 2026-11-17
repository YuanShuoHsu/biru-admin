import RouteTabs from "@/components/RouteTabs";

const ChecklistsTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <RouteTabs
      ariaLabel="checklists tabs"
      tabs={[{ path: "/checklists/templates" }]}
    />
    {children}
  </>
);

export default ChecklistsTabsLayout;
