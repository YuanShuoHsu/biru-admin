"use client";

import CustomizedDialogs from "@/components/CustomizedDialogs";
import HideAppBar from "@/components/HideAppBar";
import ScrollTop from "@/components/ScrollTop";
import TemporaryDrawer from "@/components/TemporaryDrawer";

import { FILL_VIEWPORT_ROUTES } from "@/constants/route";

import { usePathname } from "@/i18n/navigation";

import { KeyboardArrowUp } from "@mui/icons-material";
import {
  Box,
  Container,
  CssBaseline,
  Fab,
  Toolbar,
  type BoxProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface StyledBoxProps extends BoxProps {
  fillViewport: boolean;
}

const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "fillViewport",
})<StyledBoxProps>(({ fillViewport, theme }) => ({
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.vars.palette.background.default,
  transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1)",

  ...(fillViewport && {
    [theme.breakpoints.up("md")]: {
      height: "100dvh",
    },
  }),
}));

const StyledContainer = styled(Container)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

interface AppProps {
  children: React.ReactNode;
}

const App = ({ children }: AppProps) => {
  const pathname = usePathname();

  const fillViewport = FILL_VIEWPORT_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <StyledBox fillViewport={fillViewport}>
      <CssBaseline />
      <HideAppBar />
      <TemporaryDrawer />
      <Toolbar id="back-to-top-anchor" />
      <StyledContainer disableGutters>{children}</StyledContainer>
      <ScrollTop>
        <Fab aria-label="scroll back to top" size="small">
          <KeyboardArrowUp />
        </Fab>
      </ScrollTop>
      <CustomizedDialogs />
    </StyledBox>
  );
};

export default App;
