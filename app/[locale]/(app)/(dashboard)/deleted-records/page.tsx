import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import DeletedRecords from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  canRestoreDeletedRecords,
  getDeletedRecords,
} from "@/utils/deletedRecords";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getResolvedAdminOrganization, getSession } from "@/utils/session";

interface DeletedRecordsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    organization?: string;
    page?: string;
    pageSize?: string;
  }>;
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

const DeletedRecordsContent = async ({
  params,
  searchParams,
}: DeletedRecordsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams, session] = await Promise.all(
    [cookies(), params, searchParams, getSession()],
  );

  const cookie = cookieStore.toString();
  const init = { headers: { cookie } };

  const isPlatformAdmin = session?.user?.role === "admin";
  const organization = isPlatformAdmin
    ? undefined
    : await getResolvedAdminOrganization(rawSearchParams.organization);
  if (
    !isPlatformAdmin &&
    (!organization ||
      !(await canRestoreDeletedRecords(organization.slug, init)))
  )
    notFound();

  const { page, pageSize, redirectParams } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: [],
    filterFields: [],
    filterOperators: [],
    organizationSlug: organization?.slug,
  });

  if (redirectParams)
    redirect({ href: `/deleted-records?${redirectParams.toString()}`, locale });

  const { deletedRecords: rows, total: rowCount } = await getDeletedRecords(
    organization?.slug,
    page,
    pageSize,
    init,
  );

  return (
    <DeletedRecords
      organizationSlug={organization?.slug}
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const DeletedRecordsPage = (props: DeletedRecordsPageProps) => (
  <Suspense fallback={<DeletedRecords loading />}>
    <DeletedRecordsContent {...props} />
  </Suspense>
);

export default DeletedRecordsPage;
