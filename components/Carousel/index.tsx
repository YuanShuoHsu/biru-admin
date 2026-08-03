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

  ".swiper-button-prev": {
    "&::after": {},
  },
  ".swiper-button-next": {
    "&::after": {},
  },

  ".swiper-pagination-bullet-active": {
    width: `${theme.spacing(2)} !important`,
    backgroundColor: `${theme.vars.palette.primary.main} !important`,
    borderRadius: `${theme.shape.borderRadius}px !important`,
  },

  [theme.getColorSchemeSelector("dark")]: {
    ".swiper-pagination-bullet-active": {
      backgroundColor: `${theme.vars.palette.background.paper} !important`,
    },
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
