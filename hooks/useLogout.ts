import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";

export const useLogout = () => {
  const [isMutatingLogout, setIsMutatingLogout] = useState(false);

  const { setSession } = useAuthStore((state) => state);

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLogout = async () => {
    setIsMutatingLogout(true);

    const { error } = await authClient.signOut();

    setIsMutatingLogout(false);

    if (error) {
      enqueueSnackbar(getErrorMessage(error.code ?? "UNKNOWN_ERROR", locale), {
        variant: "error",
      });
      return;
    }

    setSession(null);
    enqueueSnackbar(tAuth("signOut.success"), { variant: "success" });

    if (pathname === "/auth/settings") router.replace("/auth/sign-in");
  };

  return {
    handleLogout,
    isMutatingLogout,
  };
};
