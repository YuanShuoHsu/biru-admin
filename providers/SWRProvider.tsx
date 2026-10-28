//  https://swr.vercel.app/docs/error-handling

"use client";

import { useSnackbar } from "notistack";
import { SWRConfig, SWRConfiguration } from "swr";

import { useRouter } from "@/i18n/navigation";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface SWRProviderProps {
  children: React.ReactNode;
  fallback: SWRConfiguration["fallback"];
}

const SWRProvider = ({ children, fallback }: SWRProviderProps) => {
  const { setSession } = useAuthStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  const router = useRouter();

  return (
    <SWRConfig
      value={{
        fallback,
        fetcher,
        onError: (error) => {
          // session 失效時重新整理，讓 proxy 把需要登入的頁面導向登入頁
          if (error.status === 401) {
            setSession(null);
            router.refresh();

            return;
          }

          if (error.status !== 403 && error.status !== 404) {
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        onErrorRetry: (error, key, config, revalidate, revalidateOpts) => {
          if (error.status === 401) return;

          SWRConfig.defaultValue.onErrorRetry(
            error,
            key,
            config,
            revalidate,
            revalidateOpts,
          );
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};

export default SWRProvider;
