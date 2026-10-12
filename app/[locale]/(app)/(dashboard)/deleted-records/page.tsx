import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import DeletedRecords from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getDeletedRecords } from "@/utils/deletedRecords";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getSession } from "@/utils/session";

interface DeletedRecordsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export const generateMetadata = async ({
  params,
}: DeletedRecordsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tDeletedRecords = await getTranslations({
    locale,
    namespace: "deletedRecords",
  });

  return { title: tDeletedRecords("label") };
};

const DeletedRecordsPage = async ({
  params,
  searchParams,
}: DeletedRecordsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams, session] = await Promise.all(
    [cookies(), params, searchParams, getSession()],
  );

  if (session?.user?.role !== "admin") notFound();

  setRequestLocale(locale);

  const { page, pageSize, redirectParams } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: [],
    filterFields: [],
    filterOperators: [],
  });

  if (redirectParams)
    redirect({ href: `/deleted-records?${redirectParams.toString()}`, locale });

  const { deletedRecords: rows, total: rowCount } = await getDeletedRecords(
    page,
    pageSize,
    { headers: { cookie: cookieStore.toString() } },
  );

  return (
    <DeletedRecords
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

export default DeletedRecordsPage;
