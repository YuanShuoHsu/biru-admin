"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ChangePasswordForm,
  useChangePasswordFormSchema,
} from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
  StyledListItem,
  StyledListItemText,
} from "@/components/FormCard";
import PasswordRuleList from "@/components/PasswordRuleList";

import { zodResolver } from "@hookform/resolvers/zod";

import useListAccounts from "@/hooks/useListAccounts";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const changePasswordFormSchema = useChangePasswordFormSchema();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ChangePasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    resolver: zodResolver(changePasswordFormSchema),
  });

  const [currentPassword, newPassword, confirmNewPassword] = useWatch({
    control,
    name: ["currentPassword", "newPassword", "confirmNewPassword"],
  });

  const {
    confirmPasswordRules,
    hasConfirmPassword,
    hasPassword,
    isConfirmPasswordError,
    isPasswordError,
    passwordRules,
  } = usePasswordValidation(newPassword, confirmNewPassword, currentPassword);

  const { data: accounts } = useListAccounts();

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const hasCredential = accounts?.some(
    ({ providerId }) => providerId === "credential",
  );

  const tAuth = useTranslations("auth");

  const handleClickShowPassword =
    (key: "currentPassword" | "newPassword" | "confirmNewPassword") => () =>
      setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const changePassword = async ({
    currentPassword,
    newPassword,
  }: ChangePasswordForm) => {
    await authClient.changePassword({
      currentPassword,
      newPassword,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: () => {
          reset();

          enqueueSnackbar(tAuth("settings.password.success"), {
            variant: "success",
          });
        },
      },
    });
  };

  const onSubmit = handleSubmit((values: ChangePasswordForm) => {
    setDialog({
      contentText: tAuth("settings.password.confirmContentText", {
        email: session?.user.email || "",
      }),
      onConfirm: () => changePassword(values),
      open: true,
      title: tAuth("settings.password.changeLabel"),
    });
  });

  const handleSendResetLink = async () => {
    if (!session?.user.email) return;

    await authClient.requestPasswordReset(
      {
        email: session.user.email,
        redirectTo: `${process.env.NEXT_PUBLIC_NEXT_URL}/${locale}/auth/reset-password`,
      },
      {
        headers: { "Accept-Language": locale },
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onRequest: () => setLoading(true),
        onSuccess: () => {
          setLoading(false);

          enqueueSnackbar(tAuth("settings.password.sendResetLinkSuccess"), {
            variant: "success",
          });
        },
      },
    );
  };

  return (
    <FormCard component="form" onSubmit={hasCredential ? onSubmit : undefined}>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.password.changeLabel")}
          </Typography>
        }
      />
      <StyledCardContent>
        {hasCredential ? (
          <>
            <TextField
              autoComplete="current-password"
              error={!!errors.currentPassword}
              fullWidth
              helperText={errors.currentPassword?.message}
              label={tAuth("settings.password.currentLabel")}
              placeholder={tAuth("settings.password.currentPlaceholder")}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        aria-label={
                          showPassword.currentPassword
                            ? tAuth("hidePassword")
                            : tAuth("showPassword")
                        }
                        edge="end"
                        onClick={handleClickShowPassword("currentPassword")}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                      >
                        {showPassword.currentPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              type={showPassword.currentPassword ? "text" : "password"}
              {...register("currentPassword")}
            />
            <TextField
              autoComplete="new-password"
              error={isPasswordError}
              fullWidth
              helperText={
                <PasswordRuleList
                  hasValue={hasPassword}
                  rules={passwordRules}
                />
              }
              label={tAuth("newPassword.label")}
              placeholder={tAuth("newPassword.placeholder")}
              required
              slotProps={{
                formHelperText: { component: "div" },
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        aria-label={
                          showPassword.newPassword
                            ? tAuth("hideNewPassword")
                            : tAuth("showNewPassword")
                        }
                        edge="end"
                        onClick={handleClickShowPassword("newPassword")}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                      >
                        {showPassword.newPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              type={showPassword.newPassword ? "text" : "password"}
              {...register("newPassword")}
            />
            <TextField
              autoComplete="new-password"
              error={isConfirmPasswordError}
              fullWidth
              helperText={
                <PasswordRuleList
                  hasValue={hasConfirmPassword}
                  rules={confirmPasswordRules}
                />
              }
              label={tAuth("confirmNewPassword.label")}
              placeholder={tAuth("confirmNewPassword.placeholder")}
              required
              slotProps={{
                formHelperText: { component: "div" },
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        aria-label={
                          showPassword.confirmNewPassword
                            ? tAuth("hideConfirmNewPassword")
                            : tAuth("showConfirmNewPassword")
                        }
                        edge="end"
                        onClick={handleClickShowPassword("confirmNewPassword")}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                      >
                        {showPassword.confirmNewPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              type={showPassword.confirmNewPassword ? "text" : "password"}
              {...register("confirmNewPassword")}
            />
          </>
        ) : (
          <StyledListItem
            disablePadding
            secondaryAction={
              <Button
                loading={loading}
                loadingPosition="end"
                onClick={handleSendResetLink}
                size="small"
                variant="contained"
              >
                {tAuth("settings.password.sendResetLink")}
              </Button>
            }
          >
            <StyledListItemText
              primary={tAuth("settings.password.noPassword.title")}
              secondary={tAuth("settings.password.noPassword.subtitle")}
              slotProps={{ secondary: { variant: "caption" } }}
            />
          </StyledListItem>
        )}
      </StyledCardContent>
      {hasCredential && (
        <StyledCardActions disableSpacing sx={{ alignItems: "flex-end" }}>
          <Button
            loading={isSubmitting}
            size="small"
            type="submit"
            variant="contained"
          >
            {tAuth("settings.password.update")}
          </Button>
        </StyledCardActions>
      )}
    </FormCard>
  );
};

export default ChangePassword;
