import ActionAreaCard from "./ActionAreaCard";

import { ViewGridSizes } from "@/constants/view";

import { Grid } from "@mui/material";

import { useViewStore } from "@/providers/view-store-provider";

import type { MenuItem } from "@/types/menu";

interface ResponsiveGridProps {
  items: MenuItem[];
  showLatest: boolean;
  showTopSold: boolean;
}

const ResponsiveGrid = ({
  items,
  showLatest,
  showTopSold,
}: ResponsiveGridProps) => {
  const { view } = useViewStore((state) => state);
  const viewGridSizes = ViewGridSizes[view];

  return (
    <Grid container spacing={2}>
      {items.map(
        ({ id, name, description, image, options, price, stock }, index) => (
          <Grid display="flex" key={id} size={viewGridSizes}>
            <ActionAreaCard
              id={id}
              name={name}
              description={description}
              image={image}
              options={options}
              price={price}
              showLatest={showLatest}
              stock={stock}
              {...(showTopSold ? { topSoldRank: index } : {})}
            />
          </Grid>
        ),
      )}
    </Grid>
  );
};

export default ResponsiveGrid;
