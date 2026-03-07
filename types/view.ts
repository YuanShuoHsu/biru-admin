export const ViewGridSizes = {
  list: { xs: 12, sm: 6, lg: 4, xl: 3 },
  module: { xs: 6, sm: 4, md: 3, lg: 2, xl: 1.5 },
} as const;

export const ViewDirections = {
  list: "row-reverse",
  module: "column",
} as const;

export type ViewMode = keyof typeof ViewGridSizes;
export type ViewDirection = (typeof ViewDirections)[ViewMode];
