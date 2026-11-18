"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { DeleteAccountForm, useDeleteAccountFormSchema } from "./definitions";

import StatusFormCard, {
  type StatusFormCardConfig,
} from "@/components/StatusFormCard";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  CheckCircle,
  DeleteForever,
  ReportGmailerrorred,
} from "@mui/icons-material";
import { Button } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountdownStore } from "@/providers/countdown-store-provider";

const DELETE_STATUS = {
  DELETED: "deleted",
  FAILED: "failed",
  VERIFYING: "verifying",
} as const;

type DeleteStatus = (typeof DELETE_STATUS)[keyof typeof DELETE_STATUS];

interface AuthDeleteAccountProps {
  email: string;
  redirectTo?: string;
  token: string;
}

const AuthDeleteAccount = ({
  email,
  redirectTo,
  token,
}: AuthDeleteAccountProps) => {
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

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const verifyingTitle = tAuth("deleteAccount.verifying.title");

  const signInPath = redirectTo || "/auth/sign-in";

  const schema = useDeleteAccountFormSchema();
  const {
    formState: { errors },
    register,
  } = useForm<DeleteAccountForm>({
    defaultValues: { email },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const deleteAccount = async () => {
      await authClient.deleteUser(
        { token },
        {
          onError: ({ error: { message } }) => {
            setState({
              errorMessage: message,
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
  }, [router, setSession, signInPath, startCountdown, token]);

  const configs: Record<DeleteStatus, StatusFormCardConfig> = {
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

  return (
    <StatusFormCard
      config={config}
      emailError={errors.email}
      emailField={register("email")}
    />
  );
};

export default AuthDeleteAccount;
