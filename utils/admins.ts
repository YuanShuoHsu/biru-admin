import { UAParser } from "ua-parser-js";

import { authClient } from "@/lib/auth-client";

export const formatUserAgent = (userAgent?: string | null): string => {
  if (!userAgent) return "";

  const {
    browser: { name: browserName },
    os: { name: osName },
  } = new UAParser(userAgent).getResult();

  return [browserName, osName].filter(Boolean).join(" · ");
};

export type UserSessions = {
  hasUserSessions: boolean;
  userSession: Record<string, boolean>;
};

export async function getUserSessions(
  users: { id: string }[],
  fetchOptions?: { headers: { cookie: string } },
): Promise<UserSessions> {
  const listUserSessions = await Promise.all(
    users.map(({ id }) =>
      authClient.admin.listUserSessions({
        userId: id,
        ...(fetchOptions && { fetchOptions }),
      }),
    ),
  );

  const userSession: UserSessions["userSession"] = {};

  users.forEach(({ id }, index) => {
    const sessions = listUserSessions[index].data?.sessions;
    if (!sessions) return;

    userSession[id] = sessions.length > 0;
  });

  const hasUserSessions = Object.values(userSession).some(Boolean);

  return { hasUserSessions, userSession };
}
