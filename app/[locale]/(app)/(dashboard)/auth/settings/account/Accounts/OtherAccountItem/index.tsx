// https://mui.com/material-ui/react-menu/#PositionedMenu.tsx

"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useSWRConfig } from "swr";

import AccountItem from "../AccountItem";

import { deviceSessionsKey } from "@/hooks/useDeviceSessions";

import { authClient } from "@/lib/auth-client";

import { MoreHoriz } from "@mui/icons-material";
import { DialogContentText, IconButton, Menu, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Session } from "@/types/auth";

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.vars.palette.error.main,
}));

interface OtherAccountItemProps {
  token: string;
  user: Session["user"];
}

const OtherAccountItem = ({ token, user }: OtherAccountItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const { setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  const { mutate } = useSWRConfig();

  const tAuth = useTranslations("auth");

  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const handleSetActiveConfirm = async () => {
    await authClient.multiSession.setActive({
      sessionToken: token,
      fetchOptions: {
        onError: ({ error: { message } }) => {
          setIsLoading(false);

          enqueueSnackbar(message, { variant: "error" });
        },
        onRequest: () => setIsLoading(true),
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          await mutate(deviceSessionsKey);

          setIsLoading(false);

          enqueueSnackbar(
            tAuth("settings.accounts.setActive.success", { email: user.email }),
            { variant: "success" },
          );
        },
      },
    });
  };

  const handleSetActiveDialog = () => {
    handleClose();

    setDialog({
      content: (
        <DialogContentText>
          {tAuth.rich("settings.accounts.setActive.confirmContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: user.email,
          })}
        </DialogContentText>
      ),
      onConfirm: handleSetActiveConfirm,
      open: true,
      title: tAuth("settings.accounts.setActive.label"),
    });
  };

  const handleRevokeConfirm = async () => {
    await authClient.multiSession.revoke({
      sessionToken: token,
      fetchOptions: {
        onError: ({ error: { message } }) => {
          setIsLoading(false);

          enqueueSnackbar(message, { variant: "error" });
        },
        onRequest: () => setIsLoading(true),
        onSuccess: async () => {
          await mutate(deviceSessionsKey);

          setIsLoading(false);

          enqueueSnackbar(
            tAuth("settings.accounts.revoke.success", { email: user.email }),
            { variant: "success" },
          );
        },
      },
    });
  };

  const handleRevokeDialog = () => {
    handleClose();

    setDialog({
      content: (
        <DialogContentText>
          {tAuth.rich("settings.accounts.revoke.confirmContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: user.email,
          })}
        </DialogContentText>
      ),
      onConfirm: handleRevokeConfirm,
      open: true,
      title: tAuth("settings.accounts.revoke.label"),
    });
  };

  return (
    <>
      <AccountItem
        user={user}
        secondaryAction={
          <IconButton
            id={`account-positioned-button-${user.id}`}
            aria-label={tAuth("settings.accounts.actions.label")}
            aria-controls={
              open ? `account-positioned-menu-${user.id}` : undefined
            }
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
        aria-labelledby={`account-positioned-button-${user.id}`}
        id={`account-positioned-menu-${user.id}`}
        onClose={handleClose}
        open={open}
        transformOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleSetActiveDialog}>
          {tAuth("settings.accounts.setActive.label")}
        </MenuItem>
        <StyledMenuItem onClick={handleRevokeDialog}>
          {tAuth("settings.accounts.revoke.label")}
        </StyledMenuItem>
      </Menu>
    </>
  );
};

export default OtherAccountItem;
