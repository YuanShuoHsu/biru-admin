"use client";

// https://mui.com/material-ui/react-drawer/#TemporaryDrawer.tsx

import { Suspense } from "react";

import NestedList from "./NestedList";

import { Box, Drawer } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDrawerStore } from "@/providers/drawer-store-provider";

import { useToggleDrawer } from "@/utils/drawer";

const StyledBox = styled(Box)({
  width: 250,
});

const TemporaryDrawer = () => {
  const { drawer } = useDrawerStore((state) => state);
  const open = drawer.nav;

  const toggleDrawer = useToggleDrawer();
  const handleClose = toggleDrawer("nav", false);

  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      onClose={handleClose}
      open={open}
    >
      <StyledBox
        onClick={handleClose}
        onKeyDown={handleClose}
        role="presentation"
      >
        <Suspense>
          <NestedList />
        </Suspense>
      </StyledBox>
    </Drawer>
  );
};

export default TemporaryDrawer;
