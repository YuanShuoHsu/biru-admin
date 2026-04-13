import { LocaleEnum } from "@/enums/Locale";

import type { Session } from "@/stores/auth-store";

export const getDisplayName = (user?: Session["user"] | null) => {
  if (!user) return "";

  const nameParts =
    user.lang === LocaleEnum.En
      ? [user.firstName, user.lastName]
      : [user.lastName, user.firstName];

  const name = nameParts.filter(Boolean).join(user.lang === LocaleEnum.En ? " " : "");

  return name || user.email || "";
};
