import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import AdminUsers from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface AdminUsersPageProps {
  params: Promise<{ locale: Locale }>;
}

const AdminUsersPage = async ({ params }: AdminUsersPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data } = await authClient.admin.listUsers({
    query: { limit: 100, offset: 0 },
    fetchOptions,
  });

  const rows = (data?.users || []).toReversed();

  return <AdminUsers rows={rows} />;
};

export default AdminUsersPage;
