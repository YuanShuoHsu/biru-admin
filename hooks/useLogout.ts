import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";

export const useLogout = () => {
  const [isMutatingLogout, setIsMutatingLogout] = useState(false);

  const { setSession } = useAuthStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLogout = async () => {
    setIsMutatingLogout(true);

    await authClient.signOut();

    setSession(null);
    enqueueSnackbar(tAuth("signOut.success"), { variant: "success" });
    setIsMutatingLogout(false);
  };

  return {
    handleLogout,
    isMutatingLogout,
  };
};
