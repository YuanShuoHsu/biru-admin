"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { type EmailForm, useEmailFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button, TextField, Typography } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const Email = () => {
  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const currentEmail = session?.user.email || "";
  const emailFormSchema = useEmailFormSchema(currentEmail);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<EmailForm>({
    defaultValues: { email: currentEmail },
    resolver: zodResolver(emailFormSchema),
  });

  useEffect(() => {
    reset({ email: currentEmail });
  }, [currentEmail, reset]);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const changeEmail = async (email: string) => {
    await authClient.changeEmail({
      newEmail: email,
      callbackURL: `${process.env.NEXT_PUBLIC_NEXT_URL}/${locale}/auth/settings`,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: () => {
          enqueueSnackbar(tAuth("settings.email.saveSuccess"), {
            variant: "success",
          });
        },
      },
    });
  };

  const onSubmit = handleSubmit(async ({ email }: EmailForm) => {
    setDialog({
      contentText: tAuth("settings.email.confirmContentText", {
        email,
      }),
      onConfirm: () => changeEmail(email),
      open: true,
      title: tAuth("settings.email.changeLabel"),
    });
  });

  return (
    <FormCard component="form" noValidate onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.email.changeLabel")}
          </Typography>
        }
      />
      <StyledCardContent>
        <TextField
          autoComplete="email"
          error={!!errors.email}
          fullWidth
          helperText={errors.email?.message}
          label={tAuth("email.label")}
          placeholder={tAuth("email.placeholder")}
          required
          type="email"
          {...register("email")}
        />
      </StyledCardContent>
      <StyledCardActions disableSpacing sx={{ alignItems: "flex-end" }}>
        <Button
          loading={isSubmitting}
          size="small"
          type="submit"
          variant="contained"
        >
          {tAuth("settings.email.update")}
        </Button>
      </StyledCardActions>
    </FormCard>
  );
};

export default Email;
