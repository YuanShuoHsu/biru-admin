const clientIdentityKeys = {
  deny: ["forwarded", "-ip", "remote-", "via", "-user"],
};

export const SENTRY_OPTIONS = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  // https://github.com/getsentry/sentry-javascript/blob/11.16.0/MIGRATION.md#if-you-want-to-keep-the-v10-default-behavior
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: clientIdentityKeys,
      response: clientIdentityKeys,
    },
    httpBodies: [],
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    graphQL: { document: false, variables: false },
  },
};
