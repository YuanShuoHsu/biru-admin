// https://mui.com/material-ui/react-app-bar/#system-HideAppBar.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { Suspense } from "react";

import AccountMenu from "./AccountMenu";
import CartIconButton from "./CartIconButton";
import LanguageMenu from "./LanguageMenu";
import ModeToggle from "./ModeToggle";

import BrandMark from "@/components/BrandMark";

import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Close, Menu } from "@mui/icons-material";
import {
  AppBar,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  useScrollTrigger,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";
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
  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);
  const { setDrawerOpen } = useDrawerStore((state) => state);
  const handleNavOpen = handleDrawerToggle(setDrawerOpen, "nav", true);

  const locale = useLocale();

  const router = useRouter();

  const { storeSlug } = useParams();

  const { enqueueSnackbar } = useSnackbar();

  const tAdmins = useTranslations("admins");

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === "true";
  const showAuthControls = !isMaintenanceMode && !!session;
  const isImpersonating = !!session?.session.impersonatedBy;

  const handleStopImpersonating = () => {
    setDialog({
      content: (
        <DialogContentText>
          {tAdmins.rich("actions.stopImpersonating.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: session!.user.email,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await authClient.admin.stopImpersonating({
          fetchOptions: {
            onError: ({ error: { code } }) => {
              enqueueSnackbar(getErrorMessage(code, locale), {
                variant: "error",
              });
            },
            onSuccess: async () => {
              const { data } = await authClient.getSession();
              setSession(data);

              enqueueSnackbar(tAdmins("actions.stopImpersonating.success"), {
                variant: "success",
              });

              router.replace("/admins?page=1&pageSize=10");
            },
          },
        });
      },
      open: true,
      title: tAdmins("actions.stopImpersonating.title"),
    });
  };

  return (
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
          {isImpersonating && (
            <Tooltip
              title={tAdmins("actions.stopImpersonating.impersonating", {
                email: session.user.email,
              })}
            >
              <Chip
                color="warning"
                deleteIcon={<Close />}
                label={tAdmins("actions.stopImpersonating.title")}
                onClick={handleStopImpersonating}
                onDelete={handleStopImpersonating}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
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
