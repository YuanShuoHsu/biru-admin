"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Fragment, useState } from "react";
import useSWR from "swr";

import OtherSessionItem from "./OtherSessionItem";
import SessionItem from "./SessionItem";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { swrKeys } from "@/constants/swr";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Logout } from "@mui/icons-material";
import { Button, Divider, Stack, Typography } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

const Sessions = () => {
  const [loading, setLoading] = useState(false);

  const { session, setSession } = useAuthStore((state) => state);

  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { data = [], mutate } = useSWR<DeviceSession[]>(
    session ? swrKeys.deviceSessions : null,
    async () => {
      const { data } = await authClient.multiSession.listDeviceSessions();

      return data || [];
    },
  );

  const otherSessions = data.filter(
    ({ session: { token } }) => token !== session?.session.token,
  );

  const tAuth = useTranslations("auth");

  const handleRevokeCurrentSessionConfirm = async () => {
    if (!session) return;

    await authClient.multiSession.revoke({
      sessionToken: session.session.token,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onRequest: () => setLoading(true),
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          await mutate();

          setLoading(false);

          enqueueSnackbar(tAuth("signOut.success"), { variant: "success" });

          if (!data) router.replace("/auth/sign-in");
        },
      },
    });
  };

  const handleRevokeCurrentSessionDialog = () =>
    setDialog({
      contentText: tAuth("signOut.confirmContentText", {
        email: session?.user.email || "",
      }),
      onConfirm: handleRevokeCurrentSessionConfirm,
      open: true,
      title: tAuth("signOut.label"),
    });

  return (
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.sessions.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <Stack gap={2} width="100%">
          <SessionItem
            user={session?.user}
            showCurrentChip
            secondaryAction={
              <Button
                loading={loading}
                loadingPosition="end"
                onClick={handleRevokeCurrentSessionDialog}
                size="small"
                startIcon={<Logout fontSize="small" />}
                variant="outlined"
              >
                {tAuth("signOut.label")}
              </Button>
            }
          />
          {otherSessions.map(({ session: { token }, user }) => (
            <Fragment key={token}>
              <Divider flexItem />
              <OtherSessionItem token={token} user={user} />
            </Fragment>
          ))}
        </Stack>
      </StyledCardContent>
    </FormCard>
  );
};

export default Sessions;
