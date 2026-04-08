import { authClient } from "@/lib/auth-client";

export type UserSessions = {
  hasUserSessions: boolean;
  userSessionMap: Record<string, boolean>;
};

export async function getUserSessions(
  users: { id: string }[],
  fetchOptions?: { headers: { cookie: string } },
): Promise<UserSessions> {
  const sessionResults = await Promise.all(
    users.map(({ id }) =>
      authClient.admin.listUserSessions({
        userId: id,
        ...(fetchOptions && { fetchOptions }),
      }),
    ),
  );

  const userSessionMap: UserSessions["userSessionMap"] = {};

  users.forEach(({ id }, index) => {
    const sessions = sessionResults[index].data?.sessions;
    if (!sessions) return;

    userSessionMap[id] = sessions.length > 0;
  });

  const hasUserSessions = Object.values(userSessionMap).some(Boolean);

  return { hasUserSessions, userSessionMap };
}
