// https://mui.com/material-ui/react-app-bar/#system-BackToTop.tsx

import { Box, Fade, useScrollTrigger } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBox = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(2),
  right: theme.spacing(2),
}));

interface ScrollTopProps {
  children?: React.ReactElement<unknown>;
}

const ScrollTop: React.FC<ScrollTopProps> = ({ children }) => {
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
