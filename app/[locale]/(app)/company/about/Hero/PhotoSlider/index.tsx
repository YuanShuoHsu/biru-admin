"use client";

import Image from "next/image";
import { Autoplay } from "swiper/modules";

import Carousel from "@/components/Carousel";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const SLIDE_COUNT = 10;

const MaskBox = styled(Box)(({ theme }) => ({
  position: "relative",
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

const PhotoBox = styled(Box)(({ theme }) => ({
  position: "relative",
  aspectRatio: "4/3",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const PhotoSlider = () => (
  <MaskBox>
    <Carousel
      autoplay={{ delay: 0, disableOnInteraction: false }}
      breakpoints={{
        0: { slidesPerView: 1, spaceBetween: 8 },
        600: { slidesPerView: 2, spaceBetween: 12 },
        900: { slidesPerView: 3, spaceBetween: 16 },
        1200: { slidesPerView: 4, spaceBetween: 16 },
      }}
      loop={true}
      modules={[Autoplay]}
      onSetTransition={(swiper) => {
        swiper.wrapperEl.style.transitionTimingFunction = "linear";
      }}
      pagination={false}
      spaceBetween={8}
      speed={4000}
    >
      {Array.from({ length: SLIDE_COUNT }, (_, index) => (
        <PhotoBox key={index}>
          <Image
            alt={`Photo ${index + 1}`}
            fill
            priority={index < 4}
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
            src="/images/IMG_4590.jpg"
            style={{ objectFit: "cover" }}
          />
        </PhotoBox>
      ))}
    </Carousel>
  </MaskBox>
);

export default PhotoSlider;
