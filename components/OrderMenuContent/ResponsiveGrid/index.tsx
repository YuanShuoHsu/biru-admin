import ActionAreaCard from "./ActionAreaCard";

import { ViewGridSizes } from "@/constants/view";

import { Grid } from "@mui/material";

import { useViewStore } from "@/providers/view-store-provider";

import type { OrderMenuItem } from "@/types/menus";

interface ResponsiveGridProps {
  menuItems: OrderMenuItem[];
}

const ResponsiveGrid = ({ menuItems }: ResponsiveGridProps) => {
  const { view } = useViewStore((state) => state);
  const viewGridSizes = ViewGridSizes[view];

  return (
    <Grid container spacing={2}>
      {menuItems.map((menuItem) => (
        <Grid display="flex" key={menuItem.id} size={viewGridSizes}>
          <ActionAreaCard menuItem={menuItem} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;
