// https://nextjs.org/docs/app/api-reference/file-conventions/error

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import ErrorAlert from "@/components/ErrorAlert";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

const ErrorPage = ({ error, retry }: ErrorPageProps) => {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorAlert
      digest={
        error instanceof Error
          ? (error as { digest?: string }).digest
          : undefined
      }
      onRetry={retry}
    />
  );
};

export default ErrorPage;
