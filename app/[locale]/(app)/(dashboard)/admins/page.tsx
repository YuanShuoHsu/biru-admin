import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import AdminUsers from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface AdminsPageProps {
  params: Promise<{ locale: Locale }>;
}

const AdminsPage = async ({ params }: AdminsPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data } = await authClient.admin.listUsers({
    query: { limit: 10, offset: 0, sortBy: "createdAt", sortDirection: "desc" },
    fetchOptions,
  });

  const rows = data?.users ?? [];
  const total = data?.total ?? 0;

  return <AdminUsers rows={rows} total={total} />;
};

export default AdminsPage;
