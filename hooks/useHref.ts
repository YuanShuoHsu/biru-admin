"use client";

import { useSearchParams } from "next/navigation";

import { usePathname } from "@/i18n/navigation";

export const useHref = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const href = `${pathname}${query}`;

  return href;
};
