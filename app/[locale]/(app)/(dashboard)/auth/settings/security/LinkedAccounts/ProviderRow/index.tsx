"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import type { Provider } from "..";

import { query } from "@/constants/query";

import useListAccounts from "@/hooks/useListAccounts";

import { StyledListItem, StyledListItemText } from "@/components/FormCard";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Link as LinkIcon, LinkOff as LinkOffIcon } from "@mui/icons-material";
import {
  Avatar,
  Button,
  DialogContentText,
  ListItemIcon,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.action.selected,
}));

const ProviderRow = ({ id, Icon, label }: Provider) => {
  const [loading, setLoading] = useState(false);

  const { setDialog } = useDialogStore((state) => state);

  const { data: accounts, mutate } = useListAccounts();
  const linkedAccount = accounts?.find(({ providerId }) => providerId === id);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLinkConfirm = async () => {
    const callbackURL = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/settings/security`;
    const errorCallbackURL = new URL(callbackURL);
    errorCallbackURL.searchParams.set(query.oauth, id);

    await authClient.linkSocial({
      provider: id,
      callbackURL,
      errorCallbackURL: errorCallbackURL.toString(),
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
      content: (
        <DialogContentText>
          {tAuth.rich("settings.linkedAccounts.confirmLinkContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            provider: label,
          })}
        </DialogContentText>
      ),
      onConfirm: handleLinkConfirm,
      open: true,
      title: tAuth("settings.linkedAccounts.link"),
    });
  };

  const handleUnlinkConfirm = async () => {
    if (!linkedAccount) return;

    await authClient.unlinkAccount(
      { accountId: linkedAccount.id },
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
      content: (
        <DialogContentText>
          {tAuth.rich("settings.linkedAccounts.confirmUnlinkContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            provider: label,
          })}
        </DialogContentText>
      ),
      onConfirm: handleUnlinkConfirm,
      open: true,
      title: tAuth("settings.linkedAccounts.unlink"),
    });
  };

  const secondaryAction = linkedAccount ? (
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
    <StyledListItem disablePadding secondaryAction={secondaryAction}>
      <ListItemIcon>
        <StyledAvatar variant="rounded">
          <Icon />
        </StyledAvatar>
      </ListItemIcon>
      <StyledListItemText
        primary={label}
        secondary={tAuth("settings.linkedAccounts.subtitle", {
          provider: label,
        })}
        slotProps={{ secondary: { variant: "caption" } }}
      />
    </StyledListItem>
  );
};

export default ProviderRow;
