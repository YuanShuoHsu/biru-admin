import useSWR from "swr";

import { authClient } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";

import { listAccountsKey } from "@/utils/auth";

const useListAccounts = () => {
  const { session } = useAuthStore((state) => state);

  return useSWR(
    session ? [listAccountsKey, session.user.id] : null,
    async () => {
      const { data } = await authClient.listAccounts();

      return data;
    },
  );
};

export default useListAccounts;
