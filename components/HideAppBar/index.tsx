// https://mui.com/material-ui/react-app-bar/#system-HideAppBar.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Suspense } from "react";

import AccountMenu from "./AccountMenu";
import CartIconButton from "./CartIconButton";
import LanguageMenu from "./LanguageMenu";
import ThemeSwitcher from "./ThemeSwitcher";

import BrandMark from "@/components/BrandMark";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";
import { IMPERSONATE_RETURN_KEY } from "@/constants/route";
import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";

import { usePathname, useRouter } from "@/i18n/navigation";

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

import { useToggleDrawer } from "@/utils/drawer";

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "trigger",
})<{ trigger: boolean }>(({ theme, trigger }) => ({
  top: trigger ? -APP_BAR_TOOLBAR_HEIGHT : 0,
  backgroundImage: "none",
  transition: theme.transitions.create(["background-color", "top"]),

  [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
    top: trigger ? -APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE : 0,
  },

  [theme.breakpoints.up("sm")]: {
    top: trigger ? -APP_BAR_TOOLBAR_HEIGHT_SM_UP : 0,
  },
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

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  const { enqueueSnackbar } = useSnackbar();

  const toggleDrawer = useToggleDrawer();

  const tAdmins = useTranslations("admins");

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

              const returnTo =
                sessionStorage.getItem(IMPERSONATE_RETURN_KEY) ||
                "/admins?page=1&pageSize=10";
              sessionStorage.removeItem(IMPERSONATE_RETURN_KEY);

              router.replace(returnTo);
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
              onClick={toggleDrawer("nav", true)}
            >
              <Menu />
            </IconButton>
          )}
          <BrandMark />
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <ThemeSwitcher />
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
          {pathname.startsWith("/order/") && <CartIconButton />}
        </Stack>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default HideAppBar;
