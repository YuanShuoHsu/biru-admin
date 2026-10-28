import useSWR from "swr";

import { useSession } from "@/hooks/useSession";

import { authClient } from "@/lib/auth-client";

export const deviceSessionsKey = "device-sessions";

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

const useDeviceSessions = () => {
  const session = useSession();

  return useSWR<DeviceSession[]>(
    session ? deviceSessionsKey : null,
    async () => {
      const { data, error } =
        await authClient.multiSession.listDeviceSessions();
      if (error) throw error;

      return data;
    },
  );
};

export default useDeviceSessions;
