"use client";

import CustomizedDialogs from "@/components/CustomizedDialogs";
import HideAppBar from "@/components/HideAppBar";
import ScrollTop from "@/components/ScrollTop";
import TemporaryDrawer from "@/components/TemporaryDrawer";

import { KeyboardArrowUp } from "@mui/icons-material";
import { Box, Container, CssBaseline, Fab, Toolbar } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBox = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.vars.palette.background.default,
  transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
}));

const StyledContainer = styled(Container)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
});

interface AppProps {
  children: React.ReactNode;
}

const App = ({ children }: AppProps) => (
  <StyledBox>
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

export default App;
