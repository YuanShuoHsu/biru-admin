import ActionAreaCard from "./ActionAreaCard";

import { LATEST, TOP_SOLD } from "@/constants/tab";
import { ViewGridSizes } from "@/constants/view";

import { Grid } from "@mui/material";

import { useViewStore } from "@/providers/view-store-provider";

import type { components } from "@/types/api";

interface ResponsiveGridProps {
  group: components["schemas"]["OrderMenuResponseDto"];
}

const ResponsiveGrid = ({ group: { id, menuItems } }: ResponsiveGridProps) => {
  const { view } = useViewStore((state) => state);
  const viewGridSizes = ViewGridSizes[view];

  const showLatest = id === LATEST;
  const showTopSold = id === TOP_SOLD;

  return (
    <Grid container spacing={2}>
      {menuItems.map((menuItem, index) => (
        <Grid display="flex" key={menuItem.id} size={viewGridSizes}>
          <ActionAreaCard
            item={menuItem}
            options={[]}
            showLatest={showLatest}
            {...(showTopSold ? { topSoldRank: index } : {})}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;
