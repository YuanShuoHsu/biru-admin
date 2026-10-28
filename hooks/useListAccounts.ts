import useSWR from "swr";

import { useSession } from "@/hooks/useSession";

import { authClient } from "@/lib/auth-client";

import { listAccountsKey } from "@/utils/auth";
import { toFetchError } from "@/utils/errors";

const useListAccounts = () => {
  const session = useSession();

  return useSWR(
    session ? [listAccountsKey, session.user.id] : null,
    async () => {
      const { data, error } = await authClient.listAccounts();
      if (error) throw toFetchError(error);

      return data;
    },
  );
};

export default useListAccounts;
