import { authClient } from "@/lib/auth-client";

interface QuickFilterMessages {
  role: { admin: string; user: string };
  status: { banned: string; active: string };
  emailSubscribed: { subscribed: string; unsubscribed: string };
}

export const buildQuickFilterMap = ({
  role: { admin, user },
  status: { banned, active },
  emailSubscribed: { subscribed, unsubscribed },
}: QuickFilterMessages): Record<string, string> => ({
  [admin]: "admin",
  [user]: "user",
  [banned]: "true",
  [active]: "false",
  [subscribed]: "true",
  [unsubscribed]: "false",
});

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
