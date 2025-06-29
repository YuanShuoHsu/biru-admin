// https://mui.com/material-ui/react-app-bar/#system-HideAppBar.tsx

import { Slide, useScrollTrigger } from "@mui/material";

interface HideOnScrollProps {
  children?: React.ReactElement<unknown>;
}

const HideOnScroll: React.FC<HideOnScrollProps> = ({ children }) => {
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children ?? <div />}
    </Slide>
  );
};

export default HideOnScroll;
