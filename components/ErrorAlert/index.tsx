"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Alert, AlertTitle, Button } from "@mui/material";

import { useRouter } from "@/i18n/navigation";

interface ErrorAlertProps {
  digest?: string;
  onRetry?: () => void;
}

const ErrorAlert = ({ digest, onRetry }: ErrorAlertProps) => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const tCommon = useTranslations("common");

  const handleRetry = () =>
    startTransition(() => (onRetry ? onRetry() : router.refresh()));

  return (
    <Alert
      action={
        <Button
          color="inherit"
          loading={isPending}
          onClick={handleRetry}
          size="small"
        >
          {tCommon("error.retry")}
        </Button>
      }
      severity="error"
    >
      <AlertTitle>{tCommon("error.title")}</AlertTitle>
      {tCommon("error.description")}
      {digest && ` ${tCommon("error.digest", { digest })}`}
    </Alert>
  );
};

export default ErrorAlert;
