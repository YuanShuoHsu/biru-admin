"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useVerifyEmailFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { query } from "@/constants/query";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  MarkEmailRead,
  MarkEmailUnread,
  ReportGmailerrorred,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountdownStore } from "@/providers/countdown-store-provider";

import { getHref } from "@/utils/href";

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color: "error" | "primary" }>(({ color, theme }) => {
  const mainColor = theme.palette[color].main;

  return {
    width: theme.spacing(7),
    height: theme.spacing(7),
    backgroundColor: alpha(mainColor, 0.2),
    color: mainColor,
  };
});

const VERIFY_STATUS = {
  DEFAULT: "default",
  FAILED: "failed",
  VERIFIED: "verified",
  VERIFYING: "verifying",
} as const;

type VerifyStatus = (typeof VERIFY_STATUS)[keyof typeof VERIFY_STATUS];

interface AuthVerifyEmailProps {
  email: string;
  locale: Locale;
  redirectTo?: string;
  token: string;
}

const AuthVerifyEmail = ({
  email,
  locale,
  redirectTo,
  token,
}: AuthVerifyEmailProps) => {
  const [verifyState, setVerifyState] = useState<{
    errorMessage: string;
    status: VerifyStatus;
  }>({
    errorMessage: "",
    status: token ? VERIFY_STATUS.VERIFYING : VERIFY_STATUS.DEFAULT,
  });

  const { setSession } = useAuthStore((state) => state);

  const { items, startCountdown } = useCountdownStore((state) => state);
  const redirectCountdown = items["verify-email-redirect"];

  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      const { error } = await authClient.verifyEmail(
        { query: { token } },
        { headers: { "Accept-Language": locale } },
      );

      if (error?.code) {
        setVerifyState({
          errorMessage: getErrorMessage(error.code, locale),
          status: VERIFY_STATUS.FAILED,
        });

        return;
      }

      const { data } = await authClient.getSession();
      setSession(data);

      setVerifyState({ errorMessage: "", status: VERIFY_STATUS.VERIFIED });
      startCountdown("verify-email-redirect", 3, () => {
        router.replace(redirectTo || "/");
      });
    };

    verifyToken();
  }, [locale, redirectTo, router, setSession, startCountdown, token]);

  const countdown = items["verify-email"];
  const isCountingDown = countdown > 0;

  const verifyEmailFormSchema = useVerifyEmailFormSchema();
  type VerifyEmailFormData = z.infer<typeof verifyEmailFormSchema>;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<VerifyEmailFormData>({
    defaultValues: { email },
    resolver: zodResolver(verifyEmailFormSchema),
  });

  const tAuth = useTranslations("auth");

  const verifyEmailActions = tAuth("verifyEmail.actions");
  const verifyingTitle = tAuth("verifyEmail.verifying.title");

  const resendButton = (
    <Button
      disabled={isSubmitting || isCountingDown}
      fullWidth
      loading={isSubmitting}
      loadingPosition="start"
      size="large"
      type="submit"
      variant="contained"
    >
      {isCountingDown
        ? tAuth("verifyEmail.countdown", {
            actions: verifyEmailActions,
            seconds: countdown,
          })
        : verifyEmailActions}
    </Button>
  );

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: redirectTo,
  });
  const signUpHref = getHref("/auth/sign-up", {
    [query.redirectTo]: redirectTo,
  });

  const onSubmit = handleSubmit(async () => {
    const { error } = await authClient.sendVerificationEmail(
      { callbackURL: redirectTo, email },
      { headers: { "Accept-Language": locale } },
    );

    if (error?.code) {
      const message = getErrorMessage(error.code, locale);
      enqueueSnackbar(message, { variant: "error" });

      if (error.code === "EMAIL_IS_ALREADY_VERIFIED")
        router.replace(signInHref);

      return;
    }

    startCountdown("verify-email");
  });

  const configs: Record<
    VerifyStatus,
    {
      actions: React.ReactNode;
      color: "error" | "primary";
      icon: React.ElementType;
      subtitle: React.ReactNode;
      title: React.ReactNode;
    }
  > = {
    [VERIFY_STATUS.DEFAULT]: {
      actions: (
        <>
          {resendButton}
          <Divider flexItem />
          <Stack alignItems="center" flexDirection="row" gap={0.5}>
            <Typography variant="body2">
              {tAuth("verifyEmail.default.wrongEmail")}
            </Typography>
            <Link href={signUpHref} underline="hover" variant="body2">
              {tAuth("signUp.label")}
            </Link>
          </Stack>
        </>
      ),
      color: "primary",
      icon: MarkEmailUnread,
      subtitle: tAuth("verifyEmail.default.subtitle"),
      title: tAuth("verifyEmail.default.title"),
    },
    [VERIFY_STATUS.FAILED]: {
      actions: resendButton,
      color: "error",
      icon: ReportGmailerrorred,
      subtitle: verifyState.errorMessage,
      title: tAuth("verifyEmail.failed.title"),
    },
    [VERIFY_STATUS.VERIFIED]: {
      actions: (
        <Button fullWidth href={signInHref} size="large" variant="contained">
          {redirectCountdown
            ? tAuth("verifyEmail.verified.actions", {
                seconds: redirectCountdown,
              })
            : tAuth("signIn.label")}
        </Button>
      ),
      color: "primary",
      icon: MarkEmailRead,
      subtitle: tAuth("verifyEmail.verified.subtitle"),
      title: tAuth("verifyEmail.verified.title"),
    },
    [VERIFY_STATUS.VERIFYING]: {
      actions: (
        <Button disabled fullWidth loading size="large" variant="contained">
          {verifyingTitle}
        </Button>
      ),
      color: "primary",
      icon: MarkEmailUnread,
      subtitle: tAuth("verifyEmail.verifying.subtitle"),
      title: verifyingTitle,
    },
  };

  const config = configs[verifyState.status];
  const Icon = config.icon;

  return (
    <FormCard component="form" onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <Typography
            color={config.color}
            fontWeight="bold"
            textAlign="center"
            variant="h6"
          >
            {config.title}
          </Typography>
        }
      />
      <StyledCardContent>
        <StyledAvatar color={config.color}>
          <Icon fontSize="large" />
        </StyledAvatar>
        <Typography color="text.secondary" textAlign="center" variant="caption">
          {config.subtitle}
        </Typography>
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
      </StyledCardContent>
      <StyledCardActions disableSpacing>{config.actions}</StyledCardActions>
    </FormCard>
  );
};

export default AuthVerifyEmail;
