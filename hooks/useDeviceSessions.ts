import useSWR from "swr";

import { authClient } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";

export const deviceSessionsKey = "device-sessions";

type DeviceSession = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number];

const useDeviceSessions = () => {
  const { session } = useAuthStore((state) => state);

  return useSWR<DeviceSession[]>(
    session ? deviceSessionsKey : null,
    async () => {
      const { data } = await authClient.multiSession.listDeviceSessions();

      return data || [];
    },
  );
};

export default useDeviceSessions;
