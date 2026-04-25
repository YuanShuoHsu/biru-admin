"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useSWRConfig } from "swr";

import { swrKeys } from "@/constants/swr";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { UserSession } from "..";
import SessionItem from "../SessionItem";

interface OtherSessionItemProps {
  session: UserSession;
}

const OtherSessionItem = ({ session }: OtherSessionItemProps) => {
  const [loading, setLoading] = useState(false);

  const { session: authSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const { mutate } = useSWRConfig();

  const tAuth = useTranslations("auth");

  const handleRevokeConfirm = async () => {
    await authClient.revokeSession({
      token: session.token,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onRequest: () => setLoading(true),
        onSuccess: async () => {
          await mutate(swrKeys.sessions);

          setLoading(false);

          enqueueSnackbar(
            tAuth("settings.sessions.revoke.success", {
              email: authSession?.user.email || "",
            }),
            { variant: "success" },
          );
        },
      },
    });
  };

  const handleRevokeDialog = () =>
    setDialog({
      contentText: tAuth("settings.sessions.revoke.confirmContentText", {
        email: authSession?.user.email || "",
      }),
      onConfirm: handleRevokeConfirm,
      open: true,
      title: tAuth("settings.sessions.revoke.label"),
    });

  return (
    <SessionItem
      secondaryAction={
        <Button
          color="error"
          loading={loading}
          onClick={handleRevokeDialog}
          size="small"
          variant="outlined"
        >
          {tAuth("settings.sessions.revoke.label")}
        </Button>
      }
      session={session}
    />
  );
};

export default OtherSessionItem;
