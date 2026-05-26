import { Box, type BoxProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const GradientBox = styled(Box)<BoxProps>(({ theme }) => ({
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}));

export default GradientBox;
