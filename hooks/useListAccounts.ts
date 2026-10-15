import useSWR from "swr";

import { useSession } from "@/hooks/useSession";

import { authClient } from "@/lib/auth-client";

import { listAccountsKey } from "@/utils/auth";

const useListAccounts = () => {
  const session = useSession();

  return useSWR(
    session ? [listAccountsKey, session.user.id] : null,
    async () => {
      const { data } = await authClient.listAccounts();

      return data;
    },
  );
};

export default useListAccounts;
