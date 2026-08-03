export const ViewGridSizes = {
  list: { xs: 12, sm: 6, lg: 4 },
  module: { xs: 6, sm: 4, md: 3, lg: 2 },
} as const;

export const ViewDirections = {
  list: "row-reverse",
  module: "column",
} as const;

export const ViewSwiperBreakpoints = {
  list: {
    0: { slidesPerView: 1 },
    600: { slidesPerView: 2 },
    1200: { slidesPerView: 3 },
  },
  module: {
    0: { slidesPerView: 2 },
    600: { slidesPerView: 3 },
    900: { slidesPerView: 4 },
    1200: { slidesPerView: 6 },
  },
} as const;
