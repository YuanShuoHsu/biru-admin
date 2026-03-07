// https://nextjs.org/docs/app/guides/authentication
// https://mui.com/toolpad/core/react-sign-in-page/
// https://mui.com/store/sign-in/

"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

import { useResetPasswordFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import PasswordRuleList from "@/components/PasswordRuleList";

import { query } from "@/constants/query";

import { zodResolver } from "@hookform/resolvers/zod";

import { usePasswordValidation } from "@/hooks/usePasswordValidation";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getHref } from "@/utils/href";
import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

interface AuthResetPasswordProps {
  email: string;
  redirectTo?: string;
  token: string;
}

const AuthResetPassword = ({
  email,
  redirectTo,
  token,
}: AuthResetPasswordProps) => {
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmNewPassword: false,
  });

  const locale = useLocale();

  const router = useRouter();

  const tAuth = useTranslations("auth");

  const resetPasswordFormSchema = useResetPasswordFormSchema();
  type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      email,
      newPassword: "",
      confirmNewPassword: "",
    },
    resolver: zodResolver(resetPasswordFormSchema),
  });

  const [newPassword, confirmNewPassword] = useWatch({
    control,
    name: ["newPassword", "confirmNewPassword"],
  });

  const {
    passwordRules,
    confirmPasswordRules,
    isPasswordError,
    isConfirmPasswordError,
    hasPassword,
    hasConfirmPassword,
  } = usePasswordValidation(newPassword, confirmNewPassword);

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: redirectTo,
  });

  const handleClickShowPassword =
    (key: "newPassword" | "confirmNewPassword") => () =>
      setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmit = handleSubmit(
    async ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      email: __,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      confirmNewPassword: _,
      ...data
    }: ResetPasswordFormData) => {
      if (!token) return;

      const { error } = await authClient.resetPassword(
        { ...data, token },
        { headers: { "Accept-Language": locale } },
      );

      if (error?.code) {
        const message = getErrorMessage(error.code, locale);
        enqueueSnackbar(message, { variant: "error" });

        return;
      }

      enqueueSnackbar(tAuth("resetPassword.success"), { variant: "success" });
      router.replace(signInHref);
    },
  );

  return (
    <FormCard component="form" onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <Typography
            color="primary"
            fontWeight="bold"
            textAlign="center"
            variant="h6"
          >
            {tAuth("resetPassword.label")}
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
          label={tAuth("newPassword")}
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
          label={tAuth("confirmNewPassword")}
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
      </StyledCardContent>
      <StyledCardActions disableSpacing>
        <Button
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
          loadingPosition="start"
          size="large"
          type="submit"
          variant="contained"
        >
          {tAuth("resetPassword.label")}
        </Button>
        <Stack flexDirection="row" alignItems="center" gap={0.5}>
          <Typography variant="body2">{tAuth("rememberedPassword")}</Typography>
          <Link href={signInHref} underline="hover" variant="body2">
            {tAuth("signIn.label")}
          </Link>
        </Stack>
      </StyledCardActions>
    </FormCard>
  );
};

export default AuthResetPassword;
