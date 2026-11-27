"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { type VerifyEmailForm, useVerifyEmailFormSchema } from "./definitions";

import StatusFormCard, {
  type StatusFormCardConfig,
} from "@/components/StatusFormCard";

import { query } from "@/constants/query";

import { useStorefrontHref } from "@/hooks/useAuth";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  MarkEmailRead,
  MarkEmailUnread,
  ReportGmailerrorred,
} from "@mui/icons-material";
import { Button, Divider, Link, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountdownStore } from "@/providers/countdown-store-provider";

import { getHref } from "@/utils/href";

const StyledStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

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
  const storefrontHref = useStorefrontHref();

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      await authClient.verifyEmail(
        { query: { token } },
        {
          onError: ({ error: { message } }) => {
            setVerifyState({
              errorMessage: message,
              status: VERIFY_STATUS.FAILED,
            });
          },
          onSuccess: async () => {
            const { data } = await authClient.getSession();
            setSession(data);

            setVerifyState({
              errorMessage: "",
              status: VERIFY_STATUS.VERIFIED,
            });

            startCountdown("verify-email-redirect", 3, () => {
              router.replace(redirectTo || "/");
            });
          },
        },
      );
    };

    verifyToken();
  }, [locale, redirectTo, router, setSession, startCountdown, token]);

  const countdown = items["verify-email"];
  const isCountingDown = countdown > 0;

  const verifyEmailFormSchema = useVerifyEmailFormSchema();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<VerifyEmailForm>({
    defaultValues: { email },
    resolver: zodResolver(verifyEmailFormSchema),
  });

  const tAuth = useTranslations("auth");

  const verifyEmailActions = tAuth("verifyEmail.actions");
  const verifyingTitle = tAuth("verifyEmail.verifying.title");

  const resendButton = (
    <Button
      disabled={isCountingDown}
      fullWidth
      loading={isSubmitting}
      loadingPosition="end"
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
  const signUpHref = storefrontHref("/auth/sign-up");

  const onSubmit = handleSubmit(async () => {
    await authClient.sendVerificationEmail(
      { callbackURL: redirectTo, email },
      {
        onError: ({ error: { code, message } }) => {
          enqueueSnackbar(message, {
            variant: "error",
          });

          if (code === "EMAIL_ALREADY_VERIFIED") router.replace(signInHref);
        },
        onSuccess: () => {
          startCountdown("verify-email");
        },
      },
    );
  });

  const configs: Record<VerifyStatus, StatusFormCardConfig> = {
    [VERIFY_STATUS.DEFAULT]: {
      actions: (
        <>
          {resendButton}
          <Divider flexItem />
          <StyledStack>
            <Typography variant="body2">
              {tAuth("verifyEmail.default.wrongEmail")}
            </Typography>
            <Link href={signUpHref} underline="hover" variant="body2">
              {tAuth("signUp.label")}
            </Link>
          </StyledStack>
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
        <Button
          fullWidth
          loading
          loadingPosition="end"
          size="large"
          variant="contained"
        >
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

  return (
    <StatusFormCard
      config={config}
      email={email}
      emailError={errors.email?.message}
      onSubmit={onSubmit}
    />
  );
};

export default AuthVerifyEmail;
