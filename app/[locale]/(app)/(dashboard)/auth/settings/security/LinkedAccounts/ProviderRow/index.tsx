"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState, type ComponentType } from "react";

import useListAccounts from "@/hooks/useListAccounts";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Link as LinkIcon, LinkOff as LinkOffIcon } from "@mui/icons-material";
import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

interface ProviderRowProps {
  Icon: ComponentType;
  label: string;
  providerId: string;
}

const ProviderRow = ({ Icon, label, providerId }: ProviderRowProps) => {
  const [loading, setLoading] = useState(false);

  const { setDialog } = useDialogStore((state) => state);

  const { data: accounts, mutate } = useListAccounts();
  const isLinked = accounts?.some(({ providerId: id }) => id === providerId);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLinkConfirm = async () => {
    await authClient.linkSocial({
      provider: providerId,
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
      { providerId },
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

  const action = isLinked ? (
    <Button
      aria-label={tAuth("settings.linkedAccounts.unlink")}
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
      aria-label={tAuth("settings.linkedAccounts.link")}
      disabled={isLinked === undefined}
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
    <ListItem disablePadding secondaryAction={action}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText
        primary={label}
        secondary={tAuth("settings.linkedAccounts.subtitle", { provider: label })}
        slotProps={{ secondary: { variant: "caption" } }}
      />
    </ListItem>
  );
};

export default ProviderRow;
