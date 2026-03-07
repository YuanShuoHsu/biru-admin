// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#static-blocks-in-classes
// https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
// https://github.com/microsoft/TypeScript/pull/41013

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "An error occurred while fetching the data.";
