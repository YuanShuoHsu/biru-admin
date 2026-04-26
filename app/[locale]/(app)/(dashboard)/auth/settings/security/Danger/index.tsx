"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button, ListItem, ListItemText, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledListItem = styled(ListItem)({
  "& .MuiListItemSecondaryAction-root": { right: 0 },
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
      callbackURL: `${process.env.NEXT_PUBLIC_NEXT_URL}/${locale}/auth/sign-in`,
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
    <FormCard sx={{ borderColor: "error.main" }} variant="outlined">
      <StyledCardHeader
        title={
          <Typography color="error" fontWeight="bold" variant="h6">
            {tAuth("settings.danger.label")}
          </Typography>
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
          <ListItemText
            primary={tAuth("settings.danger.title")}
            secondary={tAuth("settings.danger.subtitle")}
            slotProps={{ secondary: { variant: "caption" } }}
          />
        </StyledListItem>
      </StyledCardContent>
    </FormCard>
  );
};

export default Danger;
