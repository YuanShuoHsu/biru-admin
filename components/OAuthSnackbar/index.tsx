"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";

import { query } from "@/constants/query";

import { getErrorMessage } from "@/lib/auth-client";

const OAuthSnackbar = () => {
  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tAuth = useTranslations("auth");

  useEffect(() => {
    const provider = searchParams.get(query.oauth);
    if (!provider) return;

    const error = searchParams.get("error");

    const newParams = new URLSearchParams(searchParams);
    newParams.delete(query.oauth);
    newParams.delete("error");
    const search = newParams.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`);

    if (error) {
      const message = getErrorMessage(error, locale);
      enqueueSnackbar(message, { variant: "error" });
    } else if (provider === "google")
      enqueueSnackbar(tAuth("google.success"), { variant: "success" });
  }, [locale, pathname, router, searchParams, tAuth]);

  return null;
};

export default OAuthSnackbar;
