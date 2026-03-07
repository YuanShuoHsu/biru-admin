import { LocaleEnum } from "@/enums/Locale";

import type { Session } from "@/stores/auth-store";

export const getDisplayName = (user?: Session["user"] | null) => {
  if (!user) return "";

  const nameParts =
    user.lang !== LocaleEnum.En
      ? [user.lastName, user.firstName]
      : [user.firstName, user.lastName];

  const name = nameParts.filter(Boolean).join(" ");

  return name || user.email || "";
};
