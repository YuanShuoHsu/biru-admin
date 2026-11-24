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
  const digest =
    error instanceof Error ? (error as { digest?: string }).digest : undefined;

  useEffect(() => {
    console.error(error);
    if (!digest) Sentry.captureException(error);
  }, [digest, error]);

  return <ErrorAlert digest={digest} onRetry={retry} />;
};

export default ErrorPage;
