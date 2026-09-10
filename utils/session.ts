import { cookies } from "next/headers";
import { cache } from "react";

import { authClient } from "@/lib/auth-client";

export const getSession = cache(async () => {
  const cookieStore = await cookies();

  const { data } = await authClient.getSession({
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  return data;
});
