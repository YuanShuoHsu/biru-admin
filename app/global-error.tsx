// https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { LocaleEnum } from "@/enums/Locale";

import common from "@/messages/zh-TW/common.json";

interface GlobalErrorProps {
  error: unknown;
  retry: () => void;
}

const GlobalError = ({ error, retry }: GlobalErrorProps) => {
  const digest =
    error instanceof Error ? (error as { digest?: string }).digest : undefined;

  useEffect(() => {
    console.error(error);
    if (!digest) Sentry.captureException(error);
  }, [digest, error]);

  return (
    <html lang={LocaleEnum.ZhTW}>
      <body>
        <title>{common.error.title}</title>
        <h2>{common.error.title}</h2>
        <p>{common.error.description}</p>
        <button onClick={() => retry()}>{common.error.retry}</button>
      </body>
    </html>
  );
};

export default GlobalError;
