// https://openapi-ts.dev/openapi-fetch/
// https://openapi-ts.dev/openapi-fetch/middleware-auth

import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "@/types/api";

import type { FetchError } from "@/utils/fetcher";

const acceptLanguageMiddleware: Middleware = {
  onRequest: ({ request }) => {
    if (
      typeof document !== "undefined" &&
      !request.headers.has("Accept-Language")
    )
      request.headers.set("Accept-Language", document.documentElement.lang);
  },
};

// openapi-fetch 預設不丟錯，而且錯誤回應沒有 body 時 error 會是 undefined
const throwOnErrorMiddleware: Middleware = {
  onResponse: async ({ response }) => {
    if (response.ok) return;

    const text = await response.clone().text();

    let info;
    try {
      info = JSON.parse(text);
    } catch {
      info = { message: text };
    }

    const error: FetchError = new Error(
      info?.message || "An error occurred while fetching the data.",
    );

    error.info = info;
    error.status = response.status;
    throw error;
  },
};

export const apiClient = createClient<paths>({
  baseUrl:
    typeof window === "undefined" ? process.env.NEXT_PUBLIC_NEST_URL : "",
});

apiClient.use(acceptLanguageMiddleware, throwOnErrorMiddleware);
