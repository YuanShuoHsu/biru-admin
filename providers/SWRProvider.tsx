//  https://swr.vercel.app/docs/error-handling

"use client";

import { useSnackbar } from "notistack";
import { SWRConfig, SWRConfiguration } from "swr";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface SWRProviderProps {
  children: React.ReactNode;
  fallback: SWRConfiguration["fallback"];
}

const SWRProvider = ({ children, fallback }: SWRProviderProps) => {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <SWRConfig
      value={{
        fallback,
        fetcher,
        onError: (error) => {
          if (error.status !== 403 && error.status !== 404) {
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};

export default SWRProvider;
