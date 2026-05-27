"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef } from "react";

import { query } from "@/constants/query";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

const OAuthSnackbar = () => {
  const handled = useRef(false);

  const locale = useLocale();

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
    const search = newParams.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`);

    if (error) {
      enqueueSnackbar(getErrorMessage(error, locale), { variant: "error" });
    } else if (provider === "google") {
      authClient.getSession().then(({ data: session }) => {
        enqueueSnackbar(
          tAuth("google.success", { email: session?.user.email || "" }),
          { variant: "success" },
        );
      });
    }
  }, [error, locale, pathname, provider, router, searchParams, tAuth]);

  return null;
};

export default OAuthSnackbar;
