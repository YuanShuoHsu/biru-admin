import { Mousewheel, Navigation } from "swiper/modules";

import ActionAreaCard from "../ResponsiveGrid/ActionAreaCard";

import Carousel from "@/components/Carousel";

import { ViewSwiperBreakpoints } from "@/constants/view";

import { useViewStore } from "@/providers/view-store-provider";

import type { OrderMenuItem } from "@/types/menus";

interface FeaturedSliderProps {
  menuItems: OrderMenuItem[];
}

const FeaturedSlider = ({ menuItems }: FeaturedSliderProps) => {
  const { view } = useViewStore((state) => state);

  return (
    <Carousel
      breakpoints={ViewSwiperBreakpoints[view]}
      key={view}
      modules={[Mousewheel, Navigation]}
      mousewheel={{ forceToAxis: true }}
      navigation={true}
      spaceBetween={16}
    >
      {menuItems.map((menuItem) => (
        <ActionAreaCard key={menuItem.id} menuItem={menuItem} />
      ))}
    </Carousel>
  );
};

export default FeaturedSlider;
