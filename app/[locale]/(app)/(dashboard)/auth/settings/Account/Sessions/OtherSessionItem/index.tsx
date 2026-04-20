// https://mui.com/material-ui/react-menu/#PositionedMenu.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useSWRConfig } from "swr";

import SessionItem from "../SessionItem";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { MoreHoriz } from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Session } from "@/stores/auth-store";

interface OtherSessionItemProps {
  token: string;
  user: Session["user"];
}

const OtherSessionItem = ({ token, user }: OtherSessionItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const { setSession } = useAuthStore((state) => state);

  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const { mutate } = useSWRConfig();

  const tAuth = useTranslations("auth");

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSetActiveSessionConfirm = async () => {
    await authClient.multiSession.setActive({
      sessionToken: token,
      fetchOptions: {
        onRequest: () => setIsLoading(true),
        onError: ({ error: { code } }) => {
          setIsLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          await mutate("device-sessions");

          setIsLoading(false);

          enqueueSnackbar(
            tAuth("settings.sessions.setActive.success", { email: user.email }),
            { variant: "success" },
          );
        },
      },
    });
  };

  const handleSetActiveSessionDialog = () => {
    handleClose();

    setDialog({
      contentText: tAuth("settings.sessions.setActive.confirmContentText", {
        email: user.email,
      }),
      onConfirm: handleSetActiveSessionConfirm,
      open: true,
      title: tAuth("settings.sessions.setActive.label"),
    });
  };

  const handleRevokeSessionConfirm = async () => {
    await authClient.multiSession.revoke({
      sessionToken: token,
      fetchOptions: {
        onRequest: () => setIsLoading(true),
        onError: ({ error: { code } }) => {
          setIsLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onSuccess: async () => {
          await mutate("device-sessions");

          setIsLoading(false);

          enqueueSnackbar(
            tAuth("settings.sessions.revoke.success", { email: user.email }),
            { variant: "success" },
          );
        },
      },
    });
  };

  const handleRevokeSessionDialog = () => {
    handleClose();

    setDialog({
      contentText: tAuth("settings.sessions.revoke.confirmContentText", {
        email: user.email,
      }),
      onConfirm: handleRevokeSessionConfirm,
      open: true,
      title: tAuth("settings.sessions.revoke.label"),
    });
  };

  return (
    <>
      <SessionItem
        user={user}
        secondaryAction={
          <IconButton
            id={`positioned-button-${user.id}`}
            aria-controls={open ? `positioned-menu-${user.id}` : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            disabled={isLoading}
            onClick={handleClick}
            size="small"
          >
            <MoreHoriz />
          </IconButton>
        }
      />
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "top" }}
        aria-labelledby={`positioned-button-${user.id}`}
        id={`positioned-menu-${user.id}`}
        onClose={handleClose}
        open={open}
        transformOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleSetActiveSessionDialog}>
          {tAuth("settings.sessions.setActive.label")}
        </MenuItem>
        <MenuItem onClick={handleRevokeSessionDialog} sx={{ color: "error.main" }}>
          {tAuth("settings.sessions.revoke.label")}
        </MenuItem>
      </Menu>
    </>
  );
};

export default OtherSessionItem;
