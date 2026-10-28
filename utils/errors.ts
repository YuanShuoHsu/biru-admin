// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#static-blocks-in-classes
// https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
// https://github.com/microsoft/TypeScript/pull/41013

import type { FetchError } from "@/utils/fetcher";

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "An error occurred while fetching the data.";

export const toFetchError = ({
  message,
  status,
}: {
  message?: string;
  status: number;
}): FetchError =>
  Object.assign(
    new Error(message || "An error occurred while fetching the data."),
    { status },
  );
