import { Mousewheel, Navigation } from "swiper/modules";

import ActionAreaCard from "../ResponsiveGrid/ActionAreaCard";

import Carousel from "@/components/Carousel";

import { ViewSwiperBreakpoints } from "@/constants/view";

import { styled } from "@mui/material/styles";

import { useViewStore } from "@/providers/view-store-provider";

import type { OrderMenuItem } from "@/types/menus";

const StyledCarousel = styled(Carousel)(({ theme }) => ({
  paddingBottom: `${theme.spacing(5)} !important`,

  ".custom-swiper-button-prev, .custom-swiper-button-next": {
    top: `calc(50% - ${theme.spacing(2.5)})`,
  },
}));

interface FeaturedSliderProps {
  menuItems: OrderMenuItem[];
  priority: boolean;
}

const FeaturedSlider = ({ menuItems, priority }: FeaturedSliderProps) => {
  const { view } = useViewStore((state) => state);

  return (
    <StyledCarousel
      breakpoints={ViewSwiperBreakpoints[view]}
      key={view}
      modules={[Mousewheel, Navigation]}
      mousewheel={{ forceToAxis: true }}
      navigation={true}
      spaceBetween={16}
    >
      {menuItems.map((menuItem, index) => (
        <ActionAreaCard
          key={menuItem.id}
          menuItem={menuItem}
          priority={priority && index === 0}
        />
      ))}
    </StyledCarousel>
  );
};

export default FeaturedSlider;
