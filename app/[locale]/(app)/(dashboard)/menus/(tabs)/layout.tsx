import RouteTabs from "@/components/RouteTabs";

const MenusTabsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <RouteTabs
      ariaLabel="menu tabs"
      tabs={[{ path: "/menus/sections" }, { path: "/menus/modifier-groups" }]}
    />
    {children}
  </>
);

export default MenusTabsLayout;
