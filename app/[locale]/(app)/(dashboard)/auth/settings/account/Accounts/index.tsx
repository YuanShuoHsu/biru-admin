"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Fragment, useState } from "react";

import AccountItem from "./AccountItem";
import OtherAccountItem from "./OtherAccountItem";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Logout } from "@mui/icons-material";
import { Button, DialogContentText, Divider, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import useDeviceSessions from "@/hooks/useDeviceSessions";
import { useSession } from "@/hooks/useSession";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const Accounts = () => {
  const [loading, setLoading] = useState(false);

  const session = useSession();
  const { setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { data: accounts = [], mutate } = useDeviceSessions();
  const otherAccounts = accounts.filter(
    ({ session: { token } }) => token !== session?.session.token,
  );

  const tAuth = useTranslations("auth");

  const handleRevokeCurrentConfirm = async () => {
    if (!session) return;

    await authClient.multiSession.revoke({
      sessionToken: session.session.token,
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

  const handleRevokeCurrentDialog = () =>
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
            {tAuth("settings.accounts.manage")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        {session && (
          <AccountItem
            secondaryAction={
              <Button
                loading={loading}
                loadingPosition="end"
                onClick={handleRevokeCurrentDialog}
                size="small"
                startIcon={<Logout fontSize="small" />}
                variant="outlined"
              >
                {tAuth("signOut.label")}
              </Button>
            }
            user={session.user}
          />
        )}
        {otherAccounts.map(({ session: { token }, user }) => (
          <Fragment key={token}>
            <Divider flexItem />
            <OtherAccountItem token={token} user={user} />
          </Fragment>
        ))}
      </StyledCardContent>
    </FormCard>
  );
};

export default Accounts;
