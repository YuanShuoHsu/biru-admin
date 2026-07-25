"use client";

import { Swiper, SwiperSlide } from "swiper/react";

import NavigationButton from "./NavigationButton";

import { ChevronLeft, ChevronRight, ViewCarousel } from "@mui/icons-material";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Banner as BannerType } from "@/types/banners";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  Autoplay,
  FreeMode,
  Keyboard,
  Navigation,
  Pagination,
} from "swiper/modules";

const StyledBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  aspectRatio: "4/3",
  backgroundColor: theme.vars.palette.action.hover,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",

  [theme.breakpoints.up("sm")]: {
    aspectRatio: "16/9",
  },
}));

const StyledSwiper = styled(Swiper)(({ theme }) => ({
  width: "100%",
  height: "100%",

  ".swiper-button-prev": {
    "&::after": {},
  },
  ".swiper-button-next": {
    "&::after": {},
  },

  ".swiper-pagination-bullet": {
    backgroundColor: `${theme.vars.palette.common.white} !important`,
    opacity: "0.5 !important",
    transition: theme.transitions.create([
      "width",
      "background-color",
      "border-radius",
    ]),
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

const StyledSlide = styled(SwiperSlide)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const StyledViewCarousel = styled(ViewCarousel)(({ theme }) => ({
  fontSize: theme.spacing(8),
}));

interface BannerProps {
  banners: BannerType[];
}

const Banner = ({ banners }: BannerProps) => (
  <StyledBox>
    {banners.length ? (
      <>
        <StyledSwiper
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          freeMode={{
            sticky: true,
          }}
          grabCursor={true}
          keyboard={{
            enabled: true,
          }}
          loop={true}
          modules={[
            Autoplay,
            FreeMode,
            Keyboard,
            // Mousewheel,
            Navigation,
            Pagination,
          ]}
          // mousewheel={true}
          navigation={{
            nextEl: ".custom-swiper-button-next",
            prevEl: ".custom-swiper-button-prev",
          }}
          pagination={{
            clickable: true,
          }}
          slidesPerView={1}
          spaceBetween={0}
        >
          {banners.map(({ id, image }, index) => (
            <StyledSlide key={id}>
              <StyledImage alt={`Slide ${index + 1}`} src={image} />
            </StyledSlide>
          ))}
        </StyledSwiper>
        <NavigationButton direction="next" icon={ChevronRight} />
        <NavigationButton direction="prev" icon={ChevronLeft} />
      </>
    ) : (
      <StyledViewCarousel color="disabled" />
    )}
  </StyledBox>
);

export default Banner;
