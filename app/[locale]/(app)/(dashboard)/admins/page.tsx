import { setRequestLocale } from "next-intl/server";

import AdminUsers from ".";

import type { Locale } from "@/i18n/routing";

interface UsersPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    role?: string;
  }>;
}

const UsersPage = async ({ params, searchParams }: UsersPageProps) => {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  const query = {
    page: Math.max(1, Number(sp.page) || 1),
    limit: Number(sp.limit) || 20,
    search: sp.search || "",
    role: sp.role || "",
  };

  return <AdminUsers query={query} />;
};

export default UsersPage;
