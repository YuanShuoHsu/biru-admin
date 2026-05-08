import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Admins from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getUserSessions } from "@/utils/admins";

interface AdminsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

const AdminsPage = async ({ params, searchParams }: AdminsPageProps) => {
  const [cookieStore, { locale }, { page: rawPage, pageSize: rawPageSize }] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  if (rawPage !== String(page) || rawPageSize !== String(pageSize)) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    redirect({ href: `/admins?${params.toString()}`, locale });
  }

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const { data } = await authClient.admin.listUsers({
    query: {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    fetchOptions,
  });

  const rows = data?.users || [];
  const rowCount = data?.total || 0;

  const userSessions = await getUserSessions(rows, fetchOptions);

  return (
    <Admins
      rows={rows}
      rowCount={rowCount}
      page={page}
      pageSize={pageSize}
      userSessions={userSessions}
    />
  );
};

export default AdminsPage;
