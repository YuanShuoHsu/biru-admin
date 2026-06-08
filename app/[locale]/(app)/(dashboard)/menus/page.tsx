import { cookies } from "next/headers";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface MenusPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

const MenusPage = async ({ params, searchParams }: MenusPageProps) => {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  await cookies();

  const params_ = new URLSearchParams(
    Object.fromEntries(
      Object.entries(resolvedSearchParams).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
  );

  const query = params_.toString();

  redirect({ href: `/menus/sections${query ? `?${query}` : ""}`, locale });
};

export default MenusPage;
