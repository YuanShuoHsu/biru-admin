"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import type { Provider } from "..";

import useListAccounts from "@/hooks/useListAccounts";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Link as LinkIcon, LinkOff as LinkOffIcon } from "@mui/icons-material";
import {
  Avatar,
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
} from "@mui/material";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.action.selected,
}));

import { useDialogStore } from "@/providers/dialog-store-provider";

const ProviderRow = ({ id, Icon, label }: Provider) => {
  const [loading, setLoading] = useState(false);

  const { setDialog } = useDialogStore((state) => state);

  const { data: accounts, mutate } = useListAccounts();
  const isLinked = accounts?.some(({ providerId }) => providerId === id);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLinkConfirm = async () => {
    await authClient.linkSocial({
      provider: id,
      callbackURL: `${process.env.NEXT_PUBLIC_NEXT_URL}/${locale}/auth/settings/security`,
      fetchOptions: {
        onRequest: () => setLoading(true),
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
      },
    });
  };

  const handleLinkDialog = () => {
    setDialog({
      contentText: tAuth("settings.linkedAccounts.confirmLinkContentText", {
        provider: label,
      }),
      onConfirm: handleLinkConfirm,
      open: true,
      title: tAuth("settings.linkedAccounts.link"),
    });
  };

  const handleUnlinkConfirm = async () => {
    await authClient.unlinkAccount(
      { providerId: id },
      {
        onRequest: () => setLoading(true),
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onSuccess: () => {
          setLoading(false);

          mutate();

          enqueueSnackbar(
            tAuth("settings.linkedAccounts.unlinkSuccess", { provider: label }),
            { variant: "success" },
          );
        },
      },
    );
  };

  const handleUnlinkDialog = () => {
    setDialog({
      contentText: tAuth("settings.linkedAccounts.confirmUnlinkContentText", {
        provider: label,
      }),
      onConfirm: handleUnlinkConfirm,
      open: true,
      title: tAuth("settings.linkedAccounts.unlink"),
    });
  };

  const secondaryAction = isLinked ? (
    <Button
      color="error"
      loading={loading}
      onClick={handleUnlinkDialog}
      size="small"
      startIcon={<LinkOffIcon />}
      variant="outlined"
    >
      {tAuth("settings.linkedAccounts.unlink")}
    </Button>
  ) : (
    <Button
      loading={loading}
      onClick={handleLinkDialog}
      size="small"
      startIcon={<LinkIcon />}
      variant="outlined"
    >
      {tAuth("settings.linkedAccounts.link")}
    </Button>
  );

  return (
    <ListItem disablePadding secondaryAction={secondaryAction}>
      <ListItemIcon>
        <StyledAvatar variant="rounded">
          <Icon />
        </StyledAvatar>
      </ListItemIcon>
      <ListItemText
        primary={label}
        secondary={tAuth("settings.linkedAccounts.subtitle", {
          provider: label,
        })}
        slotProps={{ secondary: { variant: "caption" } }}
      />
    </ListItem>
  );
};

export default ProviderRow;
