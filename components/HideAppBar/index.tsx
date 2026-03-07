// https://mui.com/material-ui/react-app-bar/#system-HideAppBar.tsx

"use client";

import { Suspense } from "react";

import BrandMark from "@/components/BrandMark";

import AccountMenu from "./AccountMenu";
import CartIconButton from "./CartIconButton";
import LanguageMenu from "./LanguageMenu";
import ModeToggle from "./ModeToggle";

import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";

import { useParams } from "next/navigation";

import { Menu } from "@mui/icons-material";
import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  useScrollTrigger,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDrawerStore } from "@/providers/drawer-store-provider";

import { handleDrawerToggle } from "@/utils/drawer";

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "trigger",
})<{ trigger: boolean }>(({ theme, trigger }) => ({
  backgroundImage: "none",
  transform: trigger ? "translateY(-100%)" : "translateY(0)",
  transition: theme.transitions.create(["background-color", "transform"]),
  willChange: "transform",
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const HideAppBar = () => {
  const { setDrawerOpen } = useDrawerStore((state) => state);
  const handleNavOpen = handleDrawerToggle(setDrawerOpen, "nav", true);

  const { storeSlug } = useParams();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === "true";

  return (
    <StyledAppBar position="fixed" trigger={trigger}>
      <StyledToolbar>
        <Stack minWidth={0} flexDirection="row" alignItems="center" gap={1}>
          {!isMaintenanceMode && (
            <IconButton
              aria-label="open drawer"
              color="inherit"
              edge="start"
              onClick={handleNavOpen}
            >
              <Menu />
            </IconButton>
          )}
          <BrandMark />
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <ModeToggle />
          <Suspense>
            <LanguageMenu />
          </Suspense>
          {!isMaintenanceMode && (
            <Suspense>
              <AccountMenu />
            </Suspense>
          )}
          {!!storeSlug && <CartIconButton />}
        </Stack>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default HideAppBar;
