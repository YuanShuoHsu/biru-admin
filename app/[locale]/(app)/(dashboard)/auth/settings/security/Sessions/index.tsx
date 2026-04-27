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

export type UserSession = NonNullable<
  Awaited<ReturnType<typeof authClient.listSessions>>["data"]
>[number];

const Sessions = () => {
  const [loading, setLoading] = useState(false);

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { data: sessions = [], mutate } = useSWR<UserSession[]>(
    session ? swrKeys.sessions : null,
    async () => {
      const { data } = await authClient.listSessions();

      return data || [];
    },
  );
  const otherSessions = sessions.filter(
    ({ token }) => token !== session?.session.token,
  );

  const tAuth = useTranslations("auth");

  const handleRevokeCurrentConfirm = async () => {
    if (!session) return;

    await authClient.revokeSession({
      token: session.session.token,
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

          enqueueSnackbar(
            tAuth("signOut.success", { email: session.user.email }),
            { variant: "success" },
          );

          if (!data) router.replace("/auth/sign-in");
        },
      },
    });
  };

  const handleSignOutDialog = () =>
    setDialog({
      contentText: tAuth("signOut.confirmContentText", {
        email: session?.user.email || "",
      }),
      onConfirm: handleRevokeCurrentConfirm,
      open: true,
      title: tAuth("signOut.label"),
    });

  return (
    <FormCard component="form">
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.sessions.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <Stack gap={2} width="100%">
          {session && (
            <SessionItem
              isCurrent
              secondaryAction={
                <Button
                  loading={loading}
                  loadingPosition="end"
                  onClick={handleSignOutDialog}
                  size="small"
                  startIcon={<Logout fontSize="small" />}
                  variant="outlined"
                >
                  {tAuth("signOut.label")}
                </Button>
              }
              session={session.session}
            />
          )}
          {otherSessions.map((session) => (
            <Fragment key={session.token}>
              <Divider flexItem />
              <OtherSessionItem session={session} />
            </Fragment>
          ))}
        </Stack>
      </StyledCardContent>
    </FormCard>
  );
};

export default Sessions;
