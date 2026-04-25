import useSWR from "swr";

import { swrKeys } from "@/constants/swr";

import { authClient } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";

const useListAccounts = () => {
  const { session } = useAuthStore((state) => state);

  return useSWR(
    session ? [swrKeys.listAccounts, session.user.id] : null,
    async () => {
      const { data } = await authClient.listAccounts();

      return data;
    },
  );
};

export default useListAccounts;
