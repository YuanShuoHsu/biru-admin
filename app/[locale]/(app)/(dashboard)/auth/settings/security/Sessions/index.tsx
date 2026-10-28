"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Fragment, useState } from "react";
import useSWR from "swr";

import OtherSessionItem from "./OtherSessionItem";
import SessionItem from "./SessionItem";

import ErrorAlert from "@/components/ErrorAlert";
import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Logout } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useSession } from "@/hooks/useSession";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const StyledStack = styled(Stack)(({ theme }) => ({
  width: "100%",
  gap: theme.spacing(2),
}));

export const sessionsKey = "sessions";

export type UserSession = NonNullable<
  Awaited<ReturnType<typeof authClient.listSessions>>["data"]
>[number];

const Sessions = () => {
  const [loading, setLoading] = useState(false);

  const session = useSession();
  const { setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const {
    data: sessions = [],
    error,
    mutate,
  } = useSWR<UserSession[]>(session ? sessionsKey : null, async () => {
    const { data, error } = await authClient.listSessions();
    if (error) throw error;

    return data;
  });
  const otherSessions = sessions.filter(
    ({ token }) => token !== session?.session.token,
  );

  const tAuth = useTranslations("auth");

  const handleRevokeCurrentConfirm = async () => {
    if (!session) return;

    await authClient.revokeSession({
      token: session.session.token,
      fetchOptions: {
        onError: ({ error: { message } }) => {
          setLoading(false);

          enqueueSnackbar(message, { variant: "error" });
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
      content: (
        <DialogContentText>
          {tAuth.rich("signOut.confirmContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: session?.user.email || "",
          })}
        </DialogContentText>
      ),
      onConfirm: handleRevokeCurrentConfirm,
      open: true,
      title: tAuth("signOut.label"),
    });

  return (
    <FormCard component="form">
      <StyledCardHeader
        title={
          <StyledTypography color="primary" variant="h6">
            {tAuth("settings.sessions.label")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        <StyledStack>
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
          {error && <ErrorAlert onRetry={() => mutate()} />}
          {otherSessions.map((session) => (
            <Fragment key={session.token}>
              <Divider flexItem />
              <OtherSessionItem session={session} />
            </Fragment>
          ))}
        </StyledStack>
      </StyledCardContent>
    </FormCard>
  );
};

export default Sessions;
