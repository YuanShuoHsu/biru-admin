import { useLocale } from "next-intl";

import ActionAreaCard from "./ActionAreaCard";

import { Grid } from "@mui/material";

import { useViewStore } from "@/providers/view-store-provider";

import type { MenuItem } from "@/types/menu";
import { ViewGridSizes } from "@/types/view";

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
  const locale = useLocale();

  const { view } = useViewStore((state) => state);
  const viewGridSizes = ViewGridSizes[view];

  return (
    <Grid container spacing={2}>
      {items.map(
        ({ id, name, description, image, options, price, stock }, index) => (
          <Grid display="flex" key={id} size={viewGridSizes}>
            <ActionAreaCard
              id={id}
              name={name[locale]}
              description={description[locale]}
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
