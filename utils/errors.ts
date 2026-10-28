// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#static-blocks-in-classes
// https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
// https://github.com/microsoft/TypeScript/pull/41013
// https://www.better-auth.com/docs/concepts/client#handling-errors
// https://swr.vercel.app/docs/error-handling

import type { FetchError } from "@/utils/fetcher";

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "An error occurred while fetching the data.";

export const toFetchError = ({
  code,
  message,
  status,
}: {
  code?: string;
  message?: string;
  status: number;
}): FetchError => {
  const fallbackMessage =
    message || "An error occurred while fetching the data.";

  return Object.assign(new Error(fallbackMessage), {
    info: { code, message: fallbackMessage },
    status,
  });
};
