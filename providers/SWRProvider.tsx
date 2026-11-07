//  https://swr.vercel.app/docs/error-handling

"use client";

import { useSnackbar } from "notistack";
import { type Middleware, SWRConfig, SWRConfiguration } from "swr";

import { useRouter } from "@/i18n/navigation";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getErrorMessage } from "@/utils/errors";
import { type FetchError, fetcher } from "@/utils/fetcher";

interface SWRProviderProps {
  children: React.ReactNode;
  fallback: SWRConfiguration["fallback"];
}

const SWRProvider = ({ children, fallback }: SWRProviderProps) => {
  const { setSession } = useAuthStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  const router = useRouter();

  // https://swr.vercel.app/docs/middleware
  // 包在 fetcher 而不是 onError：hook 自帶 onError 時會蓋掉全域的 onError
  const signOutOnUnauthorized: Middleware = (useSWRNext) =>
    function useSignOutOnUnauthorized(key, keyFetcher, config) {
      return useSWRNext(
        key,
        keyFetcher &&
          (async (...args: unknown[]) => {
            try {
              return await keyFetcher(...args);
            } catch (error) {
              // session 失效時重新整理，讓 proxy 把需要登入的頁面導向登入頁
              if ((error as FetchError).status === 401) {
                setSession(null);
                router.refresh();
              }

              throw error;
            }
          }),
        config,
      );
    };

  return (
    <SWRConfig
      value={{
        fallback,
        fetcher,
        onError: (error) => {
          if (
            error.status !== 401 &&
            error.status !== 403 &&
            error.status !== 404
          ) {
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        shouldRetryOnError: (error: FetchError) => error.status !== 401,
        use: [signOutOnUnauthorized],
      }}
    >
      {children}
    </SWRConfig>
  );
};

export default SWRProvider;
