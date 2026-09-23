"use client";

import Image from "next/image";

import { Box, Link, Typography, type TypographyProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledLink = styled(Link)(({ theme }) => ({
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  flexShrink: 0,
  overflow: "hidden",
}));

interface BrandMarkProps {
  color?: TypographyProps["color"];
  href?: string;
}

const BrandMark = ({ color, href = "/" }: BrandMarkProps) => (
  <StyledLink color="inherit" href={href} underline="none">
    <ImageBox>
      <Image
        alt="biru coffee"
        draggable={false}
        fill
        loading="eager"
        sizes="32px"
        src="/images/IMG_4590.jpg"
        style={{ objectFit: "cover" }}
      />
    </ImageBox>
    <Typography color={color} component="span" noWrap variant="h6">
      Biru Coffee
    </Typography>
  </StyledLink>
);

export default BrandMark;
