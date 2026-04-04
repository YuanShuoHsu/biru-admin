import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import AdminUsers from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface AdminsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

const AdminsPage = async ({ params, searchParams }: AdminsPageProps) => {
  const [cookieStore, { locale }, { page = "0", pageSize = "10" }] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const currentPage = Number(page);
  const currentPageSize = Number(pageSize);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data } = await authClient.admin.listUsers({
    query: {
      limit: currentPageSize,
      offset: currentPage * currentPageSize,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    fetchOptions,
  });

  const rows = data?.users || [];
  const total = data?.total || 0;

  return (
    <AdminUsers
      rows={rows}
      total={total}
      page={currentPage}
      pageSize={currentPageSize}
    />
  );
};

export default AdminsPage;
