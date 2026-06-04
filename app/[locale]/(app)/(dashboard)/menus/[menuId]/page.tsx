import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface MenuPageProps {
  params: Promise<{ locale: Locale; menuId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

const MenuPage = async ({ params, searchParams }: MenuPageProps) => {
  const [{ locale, menuId }, sp] = await Promise.all([params, searchParams]);

  const query = new URLSearchParams(
    Object.entries(sp).filter(
      (entry): entry is [string, string] => entry[1] != null,
    ),
  ).toString();

  redirect({
    href: `/menus/${menuId}/sections${query ? `?${query}` : ""}`,
    locale,
  });
};

export default MenuPage;
