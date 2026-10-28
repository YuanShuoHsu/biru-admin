// https://better-auth.com/docs/concepts/users-accounts#update-user
// https://react.dev/learn/synchronizing-with-effects#fetching-data

"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

import { useSession } from "@/hooks/useSession";

import { authClient } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";

// 後端寄信和通知依 user.lang 決定語系；登入中換了頁面語系（選單、網址、自動偵測）就同步過去
const UserLanguageSync = () => {
  const locale = useLocale();

  const session = useSession();
  const setSession = useAuthStore((state) => state.setSession);

  const userId = session?.user.id;
  const lang = session?.user.lang;
  const isImpersonating = !!session?.session.impersonatedBy;

  useEffect(() => {
    if (!userId || isImpersonating || lang === locale) return;

    // 快速切換語系時只採用最後一次的結果；背景同步失敗也不能把畫面變成已登出
    let ignore = false;

    authClient.updateUser(
      { lang: locale },
      {
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          if (!ignore && data?.user.id === userId) setSession(data);
        },
      },
    );

    return () => {
      ignore = true;
    };
  }, [isImpersonating, lang, locale, setSession, userId]);

  return null;
};

export default UserLanguageSync;
