"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef } from "react";

import { query } from "@/constants/query";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

const oauthErrorCodes = [
  "access_denied",
  "account_already_linked_to_different_user",
  "email_does_not_match",
  "invalid_code",
  "unable_to_get_user_info",
] as const;

const OAuthSnackbar = () => {
  const handled = useRef(false);

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();
  const provider = searchParams.get(query.oauth);
  const error = searchParams.get("error");

  const tAuth = useTranslations("auth");

  useEffect(() => {
    if (!provider || handled.current) return;
    handled.current = true;

    const newParams = new URLSearchParams(searchParams);
    newParams.delete(query.oauth);
    newParams.delete("error");
    newParams.delete("error_description");
    const search = newParams.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`);

    if (error) {
      const code = oauthErrorCodes.find((value) => value === error);

      enqueueSnackbar(tAuth(`oauthErrors.${code ?? "default"}`), {
        variant: "error",
      });
    } else if (provider === "google") {
      authClient.getSession().then(({ data: session }) => {
        enqueueSnackbar(
          tAuth("google.success", { email: session?.user.email || "" }),
          { variant: "success" },
        );
      });
    }
  }, [error, pathname, provider, router, searchParams, tAuth]);

  return null;
};

export default OAuthSnackbar;
