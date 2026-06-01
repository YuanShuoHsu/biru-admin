import ActionAreaCard from "./ActionAreaCard";

import { LATEST, TOP_SOLD } from "@/constants/tab";
import { ViewGridSizes } from "@/constants/view";

import { Grid } from "@mui/material";

import { useViewStore } from "@/providers/view-store-provider";

import type { components } from "@/types/api";

interface ResponsiveGridProps {
  groupId: string;
  items: components["schemas"]["OrderMenuItemResponseDto"][];
}

const ResponsiveGrid = ({ groupId, items }: ResponsiveGridProps) => {
  const { view } = useViewStore((state) => state);
  const viewGridSizes = ViewGridSizes[view];

  const showLatest = groupId === LATEST;
  const showTopSold = groupId === TOP_SOLD;

  return (
    <Grid container spacing={2}>
      {items.map((item, index) => (
        <Grid display="flex" key={item.id} size={viewGridSizes}>
          <ActionAreaCard
            item={item}
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
