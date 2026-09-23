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

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button, Typography } from "@mui/material";
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
        headers: { "Accept-Language": locale },
        onRequest: () => setLoading(true),
        onError: ({ error: { code } }) => {
          setLoading(false);
          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
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
      contentText: tAuth("settings.danger.confirmContentText", {
        email: session?.user.email || "",
      }),
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
