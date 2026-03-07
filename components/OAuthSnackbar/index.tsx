"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";

import { query } from "@/constants/query";

const OAuthSnackbar = () => {
  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tAuth = useTranslations("auth");

  useEffect(() => {
    const provider = searchParams.get(query.oauth);
    if (!provider) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.delete(query.oauth);
    const search = newParams.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`);

    if (provider === "google")
      enqueueSnackbar(tAuth("google.success"), { variant: "success" });
  }, [pathname, router, searchParams, tAuth]);

  return null;
};

export default OAuthSnackbar;
