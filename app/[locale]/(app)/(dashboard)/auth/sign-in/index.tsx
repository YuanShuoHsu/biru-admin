// https://nextjs.org/docs/app/guides/authentication
// https://mui.com/toolpad/core/react-sign-in-page/
// https://mui.com/store/sign-in/

"use client";

import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { type SignInForm, useSignInFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import GoogleButton from "@/components/GoogleButton";

import { query } from "@/constants/query";
import { REMEMBER_ME } from "@/constants/sign-in";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountdownStore } from "@/providers/countdown-store-provider";

import { getHref } from "@/utils/href";
import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

interface AuthSignInProps {
  locale: Locale;
  redirectTo?: string;
  rememberMe: boolean;
}

const AuthSignIn = ({ locale, redirectTo, rememberMe }: AuthSignInProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const forgotPasswordHref = getHref("/auth/forgot-password", {
    [query.redirectTo]: redirectTo,
  });

  const signUpHref = getHref("/auth/sign-up", {
    [query.redirectTo]: redirectTo,
  });

  const { setSession } = useAuthStore((state) => state);

  const { items, startCountdown } = useCountdownStore((state) => state);

  const signInFormSchema = useSignInFormSchema();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignInForm>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe,
    },
    resolver: zodResolver(signInFormSchema),
  });

  const router = useRouter();

  const tAuth = useTranslations("auth");

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleRememberMeChange =
    (onChange: (value: boolean) => void) =>
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      Cookies.set(REMEMBER_ME, String(checked), { expires: 365 });
      onChange(checked);
    };

  const onSubmit = handleSubmit(async (data: SignInForm) => {
    await authClient.signIn.email(
      { ...data },
      {
        headers: { "Accept-Language": locale },
        onError: async ({ error: { code } }) => {
          if (code === "EMAIL_NOT_VERIFIED") {
            if (!items["verify-email"]) {
              await authClient.sendVerificationEmail(
                { callbackURL: redirectTo, email: data.email },
                { headers: { "Accept-Language": locale } },
              );

              startCountdown("verify-email");
            }

            router.push({
              pathname: "/auth/verify-email",
              query: {
                [query.email]: data.email,
                [query.redirectTo]: redirectTo,
              },
            });

            return;
          }

          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data: session } = await authClient.getSession();
          setSession(session);

          enqueueSnackbar(tAuth("signIn.success", { email: data.email }), {
            variant: "success",
          });

          router.replace(redirectTo || "/");
        },
      },
    );
  });

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
            {tAuth("signIn.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <GoogleButton action="signIn" redirectTo={redirectTo} />
        <Divider flexItem>{tAuth("or")}</Divider>
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
        <TextField
          autoComplete="current-password"
          error={!!errors.password}
          fullWidth
          helperText={errors.password?.message}
          label={tAuth("password.label")}
          placeholder={tAuth("password.placeholder")}
          required
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    aria-label={
                      showPassword
                        ? tAuth("hidePassword")
                        : tAuth("showPassword")
                    }
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          type={showPassword ? "text" : "password"}
          {...register("password")}
        />
        <Stack
          width="100%"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          <FormControlLabel
            control={
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    checked={value}
                    onChange={handleRememberMeChange(onChange)}
                    size="small"
                  />
                )}
              />
            }
            label={
              <Typography variant="body2">{tAuth("rememberMe")}</Typography>
            }
          />
          <Link href={forgotPasswordHref} underline="hover" variant="body2">
            {tAuth("forgotPassword.label")}
          </Link>
        </Stack>
      </StyledCardContent>
      <StyledCardActions disableSpacing>
        <Button
          fullWidth
          loading={isSubmitting}
          loadingPosition="end"
          size="large"
          type="submit"
          variant="contained"
        >
          {tAuth("signIn.label")}
        </Button>
        <Divider flexItem />
        <Stack flexDirection="row" alignItems="center" gap={0.5}>
          <Typography variant="body2">{tAuth("noAccount")}</Typography>
          <Link href={signUpHref} underline="hover" variant="body2">
            {tAuth("signUp.label")}
          </Link>
        </Stack>
      </StyledCardActions>
    </FormCard>
  );
};

export default AuthSignIn;
