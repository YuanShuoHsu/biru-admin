import ActionAreaCard from "./ActionAreaCard";

import { ViewGridSizes } from "@/constants/view";

import { Grid } from "@mui/material";

import { useViewStore } from "@/providers/view-store-provider";

import type { OrderMenuItem } from "@/types/menus";

interface ResponsiveGridProps {
  menuItems: OrderMenuItem[];
  priority: boolean;
}

const ResponsiveGrid = ({ menuItems, priority }: ResponsiveGridProps) => {
  const { view } = useViewStore((state) => state);
  const viewGridSizes = ViewGridSizes[view];

  return (
    <Grid container spacing={2}>
      {menuItems.map((menuItem, index) => (
        <Grid display="flex" key={menuItem.id} size={viewGridSizes}>
          <ActionAreaCard
            menuItem={menuItem}
            priority={priority && index === 0}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;
