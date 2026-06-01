"use client";

import BrandMark from "@/components/BrandMark";

import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
}));

const Newsletter = () => {
  return (
    <StyledGrid size={{ xs: 12, md: 6 }}>
      <BrandMark color="text.primary" />
    </StyledGrid>
  );
};

export default Newsletter;
