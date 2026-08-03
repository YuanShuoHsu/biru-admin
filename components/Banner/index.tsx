"use client";

import { Autoplay, Mousewheel, Navigation } from "swiper/modules";

import Carousel from "@/components/Carousel";

import { ViewCarousel } from "@mui/icons-material";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Banner as BannerType } from "@/types/banners";

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

const StyledImage = styled("img")({
  display: "block",
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
      <Carousel
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        loop={true}
        modules={[Autoplay, Mousewheel, Navigation]}
        mousewheel={{ forceToAxis: true }}
        navigation={true}
        slidesPerView={1}
        spaceBetween={0}
      >
        {banners.map(({ id, image }, index) => (
          <StyledImage alt={`Slide ${index + 1}`} key={id} src={image} />
        ))}
      </Carousel>
    ) : (
      <StyledViewCarousel color="disabled" />
    )}
  </StyledBox>
);

export default Banner;
