"use client";

import Image from "next/image";
import { Autoplay, FreeMode, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { styled } from "@mui/material/styles";

import "swiper/css";
import "swiper/css/free-mode";

const SLIDE_COUNT = 10;

const StyledSwiper = styled(Swiper)(({ theme }) => ({
  width: "100%",
  height: "100%",
  borderRadius: theme.shape.borderRadius,

  "&::before, &::after": {
    content: '""',
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "20%",
    pointerEvents: "none",
    zIndex: 2,
  },

  "&::before": {
    left: 0,
    background: `linear-gradient(to right, ${theme.palette.background.default}, transparent)`,
  },

  "&::after": {
    right: 0,
    background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
  },
}));

const StyledSlide = styled(SwiperSlide)(({ theme }) => ({
  position: "relative",
  aspectRatio: "4/3",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const PhotoSlider = () => (
  <StyledSwiper
    autoplay={{ delay: 0, disableOnInteraction: false }}
    breakpoints={{
      0: { slidesPerView: 1, spaceBetween: 8 },
      600: { slidesPerView: 2, spaceBetween: 12 },
      900: { slidesPerView: 3, spaceBetween: 16 },
      1200: { slidesPerView: 4, spaceBetween: 16 },
    }}
    freeMode={{ sticky: true }}
    grabCursor={true}
    keyboard={{ enabled: true }}
    loop={true}
    modules={[Autoplay, FreeMode, Keyboard]}
    onSetTransition={(swiper) => {
      swiper.wrapperEl.style.transitionTimingFunction = "linear";
    }}
    spaceBetween={8}
    speed={4000}
  >
    {Array.from({ length: SLIDE_COUNT }, (_, index) => (
      <StyledSlide key={index}>
        <Image
          alt={`Photo ${index + 1}`}
          fill
          priority={index < 4}
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
          src="/images/IMG_4590.jpg"
          style={{ objectFit: "cover" }}
        />
      </StyledSlide>
    ))}
  </StyledSwiper>
);

export default PhotoSlider;
