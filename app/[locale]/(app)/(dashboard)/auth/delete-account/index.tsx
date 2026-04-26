"use client";

import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  CheckCircle,
  DeleteForever,
  ReportGmailerrorred,
} from "@mui/icons-material";
import { Avatar, Button, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountdownStore } from "@/providers/countdown-store-provider";

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

const DELETE_STATUS = {
  DELETED: "deleted",
  FAILED: "failed",
  VERIFYING: "verifying",
} as const;

type DeleteStatus = (typeof DELETE_STATUS)[keyof typeof DELETE_STATUS];

interface AuthDeleteAccountProps {
  redirectTo?: string;
  token: string;
}

const AuthDeleteAccount = ({ redirectTo, token }: AuthDeleteAccountProps) => {
  const [state, setState] = useState<{
    errorMessage: string;
    status: DeleteStatus;
  }>({
    errorMessage: "",
    status: DELETE_STATUS.VERIFYING,
  });

  const { items, startCountdown } = useCountdownStore((state) => state);
  const redirectCountdown = items["delete-account-redirect"];

  const { setSession } = useAuthStore((state) => state);

  const locale = useLocale();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const verifyingTitle = tAuth("deleteAccount.verifying.title");

  const signInPath = redirectTo || `/${locale}/auth/sign-in`;

  useEffect(() => {
    const deleteAccount = async () => {
      await authClient.deleteUser(
        { token },
        {
          headers: { "Accept-Language": locale },
          onError: ({ error: { code } }) => {
            setState({
              errorMessage: getErrorMessage(code, locale),
              status: DELETE_STATUS.FAILED,
            });
          },
          onSuccess: () => {
            setSession(null);

            setState({ errorMessage: "", status: DELETE_STATUS.DELETED });

            startCountdown("delete-account-redirect", 3, () => {
              router.replace(signInPath);
            });
          },
        },
      );
    };

    deleteAccount();
  }, [locale, router, setSession, signInPath, startCountdown, token]);

  const configs: Record<
    DeleteStatus,
    {
      actions: React.ReactNode;
      color: "error" | "primary";
      icon: React.ElementType;
      subtitle: string;
      title: string;
    }
  > = {
    [DELETE_STATUS.DELETED]: {
      actions: (
        <Button
          color="error"
          fullWidth
          onClick={() => router.replace(signInPath)}
          size="large"
          variant="contained"
        >
          {redirectCountdown
            ? tAuth("deleteAccount.deleted.actions", {
                seconds: redirectCountdown,
              })
            : tAuth("signIn.label")}
        </Button>
      ),
      color: "primary",
      icon: CheckCircle,
      subtitle: tAuth("deleteAccount.deleted.subtitle"),
      title: tAuth("deleteAccount.deleted.title"),
    },
    [DELETE_STATUS.FAILED]: {
      actions: (
        <Button
          fullWidth
          onClick={() => router.replace("/")}
          size="large"
          variant="contained"
        >
          {tAuth("deleteAccount.failed.actions")}
        </Button>
      ),
      color: "error",
      icon: ReportGmailerrorred,
      subtitle: state.errorMessage || tAuth("deleteAccount.failed.subtitle"),
      title: tAuth("deleteAccount.failed.title"),
    },
    [DELETE_STATUS.VERIFYING]: {
      actions: (
        <Button
          color="error"
          fullWidth
          loading
          loadingPosition="end"
          size="large"
          variant="contained"
        >
          {verifyingTitle}
        </Button>
      ),
      color: "error",
      icon: DeleteForever,
      subtitle: tAuth("deleteAccount.verifying.subtitle"),
      title: verifyingTitle,
    },
  };

  const config = configs[state.status];
  const Icon = config.icon;

  return (
    <FormCard>
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
      </StyledCardContent>
      <StyledCardActions disableSpacing>{config.actions}</StyledCardActions>
    </FormCard>
  );
};

export default AuthDeleteAccount;
