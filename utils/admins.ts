import { fetcher } from "./fetcher";

import { authClient } from "@/lib/auth-client";

import type { UserDeletability } from "@/types/admins";

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

export const getDeletableUserIds = async (users: { id: string }[]) => {
  const params = new URLSearchParams(users.map(({ id }) => ["ids", id]));
  const deletability = await fetcher<UserDeletability[]>(
    `/api/users/deletability?${params}`,
  );

  return new Set(
    deletability.filter(({ deletable }) => deletable).map(({ id }) => id),
  );
};
