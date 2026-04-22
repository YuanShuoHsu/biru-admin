"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type SetUserPasswordForm,
  useSetUserPasswordFormSchema,
} from "./definitions";

import PasswordRuleList from "@/components/PasswordRuleList";

import { zodResolver } from "@hookform/resolvers/zod";

import { usePasswordValidation } from "@/hooks/usePasswordValidation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  type BoxProps,
  IconButton,
  InputAdornment,
  TextField,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface SetUserPasswordDialogContentProps {
  user: UserWithRole;
}

const SetUserPasswordDialogContent = ({
  user,
}: SetUserPasswordDialogContentProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);
  const locale = useLocale();
  const tAdmins = useTranslations("admins");
  const tAuth = useTranslations("auth");
  const setUserPasswordFormSchema = useSetUserPasswordFormSchema();

  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SetUserPasswordForm>({
    defaultValues: { email: user.email, newPassword: "", confirmPassword: "" },
    resolver: zodResolver(setUserPasswordFormSchema),
  });

  const [newPassword, confirmPassword] = useWatch({
    control,
    name: ["newPassword", "confirmPassword"],
  });

  const {
    passwordRules,
    confirmPasswordRules,
    isPasswordError,
    isConfirmPasswordError,
    hasPassword,
    hasConfirmPassword,
  } = usePasswordValidation(newPassword, confirmPassword);

  const handleClickShowPassword =
    (key: "newPassword" | "confirmPassword") => () =>
      setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ newPassword }) => {
      await authClient.admin.setUserPassword(
        { userId: user.id, newPassword },
        {
          onError: ({ error: { code } }) => {
            enqueueSnackbar(getErrorMessage(code, locale), {
              variant: "error",
            });
            setDialog({ confirmLoading: false });
          },
          onRequest: () => setDialog({ confirmLoading: true }),
          onSuccess: () => {
            enqueueSnackbar(tAdmins("actions.setUserPassword.success"), {
              variant: "success",
            });

            closeDialog();
          },
        },
      );
    })(event);

  return (
    <StyledBox component="form" id="set-user-password-form" onSubmit={onSubmit}>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tAdmins("email.label")}
        placeholder={tAdmins("email.placeholder")}
        required
        slotProps={{ input: { readOnly: true } }}
        type="email"
        {...register("email")}
      />
      <TextField
        autoComplete="new-password"
        error={isPasswordError}
        fullWidth
        helperText={
          <PasswordRuleList hasValue={hasPassword} rules={passwordRules} />
        }
        label={tAdmins("actions.setUserPassword.newPassword.label")}
        placeholder={tAdmins("actions.setUserPassword.newPassword.placeholder")}
        required
        slotProps={{
          formHelperText: { component: "div" },
          input: {
            endAdornment: (
              <InputAdornment position="start">
                <IconButton
                  aria-label={
                    showPassword.newPassword
                      ? tAuth("hidePassword")
                      : tAuth("showPassword")
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
        label={tAdmins("actions.setUserPassword.confirmPassword.label")}
        placeholder={tAdmins(
          "actions.setUserPassword.confirmPassword.placeholder",
        )}
        required
        slotProps={{
          formHelperText: { component: "div" },
          input: {
            endAdornment: (
              <InputAdornment position="start">
                <IconButton
                  aria-label={
                    showPassword.confirmPassword
                      ? tAuth("hidePassword")
                      : tAuth("showPassword")
                  }
                  edge="end"
                  onClick={handleClickShowPassword("confirmPassword")}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                >
                  {showPassword.confirmPassword ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        type={showPassword.confirmPassword ? "text" : "password"}
        {...register("confirmPassword")}
      />
    </StyledBox>
  );
};

export default SetUserPasswordDialogContent;
