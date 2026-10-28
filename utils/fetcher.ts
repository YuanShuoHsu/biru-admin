// https://swr.vercel.app/docs/mutation
// https://swr.vercel.app/docs/error-handling
// https://github.com/vercel/swr/discussions/939
// https://github.com/vercel/swr/blob/main/examples/basic-typescript/libs/fetch.ts
// https://nextjs.org/docs/app/getting-started/error-handling#server-components

import { unstable_rethrow } from "next/navigation";

interface ErrorInfo {
  message: string;
  code?: string;
  documentation_url?: string;
  id?: string;
}

export interface FetchError extends Error {
  info?: ErrorInfo;
  status?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_NEST_URL;

const resolveUrl = (input: RequestInfo) => {
  const url = String(input);
  const isAbsolute = /^https?:\/\//i.test(url);
  if (isAbsolute) return url;

  const isServer = typeof window === "undefined";
  if (isServer) return `${BASE_URL}${url}`;

  return url;
};

export const fetcher = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const url = resolveUrl(input);

  const headers = new Headers(init?.headers);
  if (typeof document !== "undefined" && !headers.has("Accept-Language"))
    headers.set("Accept-Language", document.documentElement.lang);

  const res = await fetch(url, { ...init, headers });

  const contentType = res.headers.get("content-type") || "";

  let data;
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = { message: "Failed to parse JSON response." };
    }
  } else {
    const text = await res.text();
    data = res.ok && !text ? null : { message: text };
  }

  if (!res.ok) {
    const error: FetchError = new Error(
      data.message || "An error occurred while fetching the data.",
    );

    error.info = data;
    error.status = res.status;
    throw error;
  }

  return data;
};

export type FetchResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: FetchError };

export const settle = async <T>(
  promise: Promise<T>,
): Promise<FetchResult<T>> => {
  try {
    return { data: await promise };
  } catch (error) {
    unstable_rethrow(error);

    return { error: error as FetchError };
  }
};

// 帶資源 id 的端點在資源不存在時，後端查不到所屬店家會先回 403，到不了 404
export const isMissingResource = (error?: FetchError) =>
  error?.status === 403 || error?.status === 404;

export const sendRequest =
  <TRes = unknown, TReq = void>(init?: RequestInit) =>
  async (url: string, { arg }: { arg?: TReq } = {}): Promise<TRes> =>
    fetcher<TRes>(url, {
      ...(arg !== undefined && { body: JSON.stringify(arg) }),
      method: "POST",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
