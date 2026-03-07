"use client";

// https://mui.com/material-ui/react-app-bar/#system-BackToTop.tsx

import { Box, Fade, useScrollTrigger } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBox = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(10),
  right: theme.spacing(2),
  zIndex: theme.zIndex.appBar - 1,
}));

interface ScrollTopProps {
  children?: React.ReactElement<unknown>;
}

const ScrollTop = ({ children }: ScrollTopProps) => {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (
      (event.target as HTMLDivElement).ownerDocument || document
    ).querySelector("#back-to-top-anchor");

    if (anchor) {
      anchor.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <Fade in={trigger}>
      <StyledBox onClick={handleClick} role="presentation">
        {children}
      </StyledBox>
    </Fade>
  );
};

export default ScrollTop;
