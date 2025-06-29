"use client";

import { useState } from "react";

import CustomizedDialogs from "@/components/CustomizedDialogs";
import HideAppBar from "@/components/HideAppBar";
import NavTemporaryDrawer from "@/components/NavTemporaryDrawer";
import ScrollTop from "@/components/ScrollTop";

import { KeyboardArrowUp } from "@mui/icons-material";
import { Box, CssBaseline, Fab, Toolbar } from "@mui/material";
import { styled } from "@mui/material/styles";

import { DrawerType } from "@/types/drawer";

const ContainerBox = styled(Box)({
  display: "flex",
});

const MainBox = styled(Box)({
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
});

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [drawerState, setDrawerState] = useState({
    cart: false,
    nav: false,
  });

  const handleDrawerToggle =
    (type: DrawerType, open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setDrawerState((prev) => ({ ...prev, [type]: open }));
    };

  return (
    <ContainerBox>
      <CssBaseline />
      <HideAppBar onDrawerToggle={handleDrawerToggle} />
      <Toolbar disableGutters id="back-to-top-anchor" />
      <NavTemporaryDrawer
        onDrawerToggle={handleDrawerToggle}
        open={drawerState.nav}
      />
      <MainBox as="main">
        <Toolbar />
        {children}
      </MainBox>
      <ScrollTop>
        <Fab aria-label="scroll back to top" size="small">
          <KeyboardArrowUp />
        </Fab>
      </ScrollTop>
      <CustomizedDialogs />
    </ContainerBox>
  );
};

export default AppLayout;
