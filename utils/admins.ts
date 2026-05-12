import { authClient } from "@/lib/auth-client";

export interface QuickFilterMessages {
  role: { admin: string; user: string };
  status: { banned: string; active: string };
  emailSubscribed: { subscribed: string; unsubscribed: string };
}

export const buildQuickFilterMap = ({
  role: { admin, user },
  status: { banned, active },
  emailSubscribed: { subscribed, unsubscribed },
}: QuickFilterMessages): Record<string, string> => ({
  [admin]: "role:admin",
  [user]: "role:user",
  [banned]: "banned:true",
  [active]: "banned:false",
  [subscribed]: "emailSubscribed:true",
  [unsubscribed]: "emailSubscribed:false",
});

export const getQuickFilterValue = (
  quickFilterMessages: QuickFilterMessages,
  quickFilterValues?: string[],
) => {
  const quickFilterText = (quickFilterValues || []).join(" ").trim();
  if (!quickFilterText) return undefined;

  const quickFilterMap = buildQuickFilterMap(quickFilterMessages);
  const matchedValue = Object.entries(quickFilterMap).find(([label]) =>
    label.toLowerCase().includes(quickFilterText.toLowerCase()),
  )?.[1];

  return matchedValue || quickFilterText;
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
