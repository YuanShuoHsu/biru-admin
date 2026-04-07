// https://mui.com/material-ui/react-app-bar/#system-HideAppBar.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import AccountMenu from "./AccountMenu";
import CartIconButton from "./CartIconButton";
import LanguageMenu from "./LanguageMenu";
import ModeToggle from "./ModeToggle";

import BrandMark from "@/components/BrandMark";

import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";

import { useRouter } from "@/i18n/navigation";

import { Menu } from "@mui/icons-material";
import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  useScrollTrigger,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
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
  const locale = useLocale();
  const router = useRouter();
  const tAdmins = useTranslations("admins");

  const { session, setSession } = useAuthStore((state) => state);
  const { setDrawerOpen } = useDrawerStore((state) => state);
  const handleNavOpen = handleDrawerToggle(setDrawerOpen, "nav", true);

  const { storeSlug } = useParams();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === "true";
  const showAuthControls = !isMaintenanceMode && !!session;

  /* TODO: check if this is the best way to check for impersonation
  const isImpersonating = !!session?.session?.impersonatedBy;

  const handleStopImpersonating = async () => {
    const { error } = await authClient.admin.stopImpersonating();

    if (error?.code) {
      enqueueSnackbar(getErrorMessage(error.code, locale), {
        variant: "error",
      });

      return;
    }

    const { data } = await authClient.getSession();
    setSession(data);
    enqueueSnackbar(tAdmins("actions.impersonate.stopSuccess"), {
      variant: "success",
    });
    router.replace("/admins");
  };
*/
  return (
    //  {isImpersonating && (
    //     <Alert
    //       action={
    //         <Button
    //           color="inherit"
    //           onClick={handleStopImpersonating}
    //           size="small"
    //         >
    //           {tAdmins("actions.impersonate.stop")}
    //         </Button>
    //       }
    //       severity="warning"
    //       sx={{
    //         borderRadius: 0,
    //         position: "fixed",
    //         top: 0,
    //         left: 0,
    //         right: 0,
    //         zIndex: (theme) => theme.zIndex.appBar + 1,
    //       }}
    //     >
    //       {tAdmins("actions.impersonate.title")}: {session?.user?.name}
    //     </Alert>
    //   )}
    <StyledAppBar position="fixed" trigger={trigger}>
      <StyledToolbar>
        <Stack minWidth={0} flexDirection="row" alignItems="center" gap={1}>
          {showAuthControls && (
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
          {showAuthControls && (
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
