"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import { query } from "@/constants/query";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button } from "@mui/material";

import { getHref } from "@/utils/href";

import GoogleIcon from "@/components/GoogleIcon";

type GoogleAction = "signIn" | "signUp";

interface GoogleButtonProps {
  action: GoogleAction;
  redirectTo?: string;
}

const GoogleButton = ({ action, redirectTo }: GoogleButtonProps) => {
  const [loading, setLoading] = useState(false);

  const locale = useLocale();

  const tAuth = useTranslations("auth");
  const label = tAuth(`google.${action}`);

  const callbackURL =
    process.env.NEXT_PUBLIC_NEXT_URL +
    getHref(redirectTo || "/", { [query.oauth]: "google" });

  const handleClick = async () => {
    await authClient.signIn.social(
      { provider: "google", callbackURL },
      {
        onError: ({ error }) => {
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });

          setLoading(false);
        },
        onRequest: () => setLoading(true),
      },
    );
  };

  return (
    <Button
      aria-label={label}
      fullWidth
      loading={loading}
      loadingPosition="end"
      onClick={handleClick}
      size="large"
      startIcon={<GoogleIcon />}
      variant="outlined"
    >
      {label}
    </Button>
  );
};

export default GoogleButton;
