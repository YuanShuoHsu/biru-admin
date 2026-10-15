"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
  StyledListItem,
  StyledListItemText,
} from "@/components/FormCard";

import { authClient } from "@/lib/auth-client";

import { Button, DialogContentText, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledFormCard = styled(FormCard)(({ theme }) => ({
  borderColor: theme.vars.palette.error.main,
}));

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const Danger = () => {
  const [loading, setLoading] = useState(false);

  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleDeleteConfirm = async () => {
    await authClient.deleteUser({
      callbackURL: `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/sign-in`,
      fetchOptions: {
        onRequest: () => setLoading(true),
        onError: ({ error: { message } }) => {
          setLoading(false);
          enqueueSnackbar(message, { variant: "error" });
        },
        onSuccess: () => {
          setLoading(false);
          enqueueSnackbar(tAuth("settings.danger.success"), {
            variant: "success",
          });
        },
      },
    });
  };

  const handleDeleteDialog = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tAuth.rich("settings.danger.confirmContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: session?.user.email || "",
          })}
        </DialogContentText>
      ),
      onConfirm: handleDeleteConfirm,
      open: true,
      title: tAuth("settings.danger.title"),
    });

  return (
    <StyledFormCard variant="outlined">
      <StyledCardHeader
        title={
          <StyledTypography color="error" variant="h6">
            {tAuth("settings.danger.label")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        <StyledListItem
          disablePadding
          secondaryAction={
            <Button
              color="error"
              loading={loading}
              onClick={handleDeleteDialog}
              size="small"
              variant="contained"
            >
              {tAuth("settings.danger.action")}
            </Button>
          }
        >
          <StyledListItemText
            primary={tAuth("settings.danger.title")}
            secondary={tAuth("settings.danger.subtitle")}
            slotProps={{ secondary: { variant: "caption" } }}
          />
        </StyledListItem>
      </StyledCardContent>
    </StyledFormCard>
  );
};

export default Danger;
