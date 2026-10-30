import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { deviceSessionsKey } from "@/hooks/useDeviceSessions";
import { useSession } from "@/hooks/useSession";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { DialogContentText } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

export const useLogout = () => {
  const session = useSession();
  const { setSession } = useAuthStore((state) => state);

  const { setDialog } = useDialogStore((state) => state);

  const { mutate } = useSWRConfig();

  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLogout = async () => {
    if (!session) return;

    const email = session.user.email;

    await authClient.multiSession.revoke({
      sessionToken: session.session.token,
      fetchOptions: {
        onError: ({ error: { message } }) => {
          enqueueSnackbar(message, {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          await mutate(deviceSessionsKey);

          enqueueSnackbar(tAuth("signOut.success", { email }), {
            variant: "success",
          });

          if (!data) router.replace("/auth/sign-in");
        },
      },
    });
  };

  const handleLogoutDialog = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tAuth.rich("signOut.confirmContentText", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: session?.user.email || "",
          })}
        </DialogContentText>
      ),
      onConfirm: handleLogout,
      open: true,
      title: tAuth("signOut.label"),
    });

  return { handleLogoutDialog };
};
