import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { swrKeys } from "@/constants/swr";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

export const useLogout = () => {
  const { session, setSession } = useAuthStore((state) => state);

  const { setDialog } = useDialogStore((state) => state);

  const { mutate } = useSWRConfig();

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLogout = async () => {
    if (!session) return;

    await authClient.multiSession.revoke({
      sessionToken: session.session.token,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          await mutate(swrKeys.deviceSessions);

          enqueueSnackbar(tAuth("signOut.success"), { variant: "success" });

          if (!data && pathname === "/auth/settings")
            router.replace("/auth/sign-in");
        },
      },
    });
  };

  const handleLogoutDialog = () =>
    setDialog({
      contentText: tAuth("signOut.confirmContentText", {
        email: session?.user.email || "",
      }),
      onConfirm: handleLogout,
      open: true,
      title: tAuth("signOut.label"),
    });

  return { handleLogoutDialog };
};
