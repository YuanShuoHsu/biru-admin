import { Children } from "react";
import { FreeMode, Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide, type SwiperProps } from "swiper/react";

import NavigationButton from "./NavigationButton";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";

const StyledSwiper = styled(Swiper)(({ theme }) => ({
  width: "100%",
  height: "100%",

  "--swiper-pagination-bullet-inactive-color": theme.vars.palette.text.primary,
  "--swiper-pagination-color": theme.vars.palette.primary.main,

  ".swiper-button-prev": {
    "&::after": {},
  },
  ".swiper-button-next": {
    "&::after": {},
  },

  ".swiper-pagination-bullet": {
    transition: theme.transitions.create([
      "width",
      "background-color",
      "border-radius",
      "opacity",
    ]),
  },

  ".swiper-pagination-bullet-active": {
    "--swiper-pagination-bullet-border-radius": `${theme.shape.borderRadius}px`,
    "--swiper-pagination-bullet-width": theme.spacing(2),
  },
}));

const StyledSwiperSlide = styled(SwiperSlide)({
  height: "auto !important",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

const Carousel = ({
  children,
  modules = [],
  navigation = false,
  ...props
}: SwiperProps) => (
  <StyledSwiper
    freeMode={{
      sticky: true,
    }}
    grabCursor={true}
    keyboard={{
      enabled: true,
    }}
    modules={[FreeMode, Keyboard, Pagination, ...modules]}
    navigation={
      navigation && {
        nextEl: ".custom-swiper-button-next",
        prevEl: ".custom-swiper-button-prev",
      }
    }
    pagination={{
      clickable: true,
    }}
    touchEventsTarget="container"
    {...props}
  >
    {Children.map(children, (child) => (
      <StyledSwiperSlide>{child}</StyledSwiperSlide>
    ))}
    {navigation && (
      <>
        <NavigationButton direction="next" icon={ChevronRight} />
        <NavigationButton direction="prev" icon={ChevronLeft} />
      </>
    )}
  </StyledSwiper>
);

export default Carousel;
