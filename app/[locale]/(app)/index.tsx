// https://nextjs.org/docs/app/guides/authentication
// https://mui.com/toolpad/core/react-sign-in-page/
// https://mui.com/store/sign-in/

"use client";

import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { useSigninFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import { REMEMBER_ME } from "@/constants/sign-in";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getHref } from "@/utils/href";
import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

const StyledContainer = styled(Container)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
});
interface HomeProps {
  locale: Locale;
  redirectTo?: string;
  rememberMe: boolean;
}

const Home = ({ locale, redirectTo, rememberMe }: HomeProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const forgotPasswordHref = getHref("/auth/forgot-password", {});

  const { setSession } = useAuthStore((state) => state);

  const signinFormSchema = useSigninFormSchema();
  type SigninFormData = z.infer<typeof signinFormSchema>;

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SigninFormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe,
    },
    resolver: zodResolver(signinFormSchema),
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

  const onSubmit = handleSubmit(async (data: SigninFormData) => {
    const { error: signInError } = await authClient.signIn.email(
      { ...data },
      { headers: { "Accept-Language": locale } },
    );

    if (signInError?.code) {
      console.log(signInError.code);
      const message = getErrorMessage(signInError.code, locale);
      enqueueSnackbar(message, { variant: "error" });

      return;
    }

    const { error: roleError } =
      await authClient.organization.getActiveMemberRole();

    if (roleError?.code) {
      await authClient.signOut();

      console.log(roleError.code);
      const message = getErrorMessage(roleError.code, locale);
      enqueueSnackbar(message, { variant: "error" });

      return;
    }

    const { data: session } = await authClient.getSession();
    setSession(session);

    enqueueSnackbar(tAuth("signIn.success"), { variant: "success" });
    router.replace(redirectTo || "/order");
  });

  return (
    <StyledContainer disableGutters maxWidth="sm">
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
            placeholder={tAuth("password.placeholder")}
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
            size="large"
            type="submit"
            variant="contained"
          >
            {tAuth("signIn.label")}
          </Button>
        </StyledCardActions>
      </FormCard>
    </StyledContainer>
  );
};

export default Home;
