import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import DeletedRecords from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  deletedRecordFilterFieldValues,
  deletedRecordSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  canRestoreDeletedRecords,
  getDeletedRecords,
} from "@/utils/deletedRecords";
import { getDeletedRecordEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
import { getResolvedAdminOrganization, getSession } from "@/utils/session";

interface DeletedRecordsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterEnums?: string | string[];
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
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
  if (!isPlatformAdmin) {
    if (!organization) notFound();

    const { data: canRestore, error } = await settle(
      canRestoreDeletedRecords(organization.slug, init),
    );
    if (error) return <ErrorAlert />;
    if (!canRestore) notFound();
  }

  const isVisibleField = (field: string) =>
    !organization || field !== "organizationName";

  const {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams,
    sortBy,
    sortDirection,
  } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: deletedRecordSortFieldValues.filter(isVisibleField),
    filterFields: deletedRecordFilterFieldValues.filter(isVisibleField),
    filterOperators: filterOperatorValues,
    organizationSlug: organization?.slug,
  });

  if (redirectParams)
    redirect({ href: `/deleted-records?${redirectParams.toString()}`, locale });

  const tDeletedRecords = await getTranslations({
    locale,
    namespace: "deletedRecords",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getDeletedRecordEnumOptions(tDeletedRecords),
      )
    : [];

  const { data: deletedRecords, error } = await settle(
    getDeletedRecords(
      organization?.slug,
      {
        page,
        pageSize,
        filterField,
        filterOperator,
        filterValue,
        quickFilterEnums,
        quickFilterValue,
        sortBy,
        sortDirection,
      },
      init,
    ),
  );
  if (error) return <ErrorAlert />;

  const { deletedRecords: rows, total: rowCount } = deletedRecords;

  return (
    <DeletedRecords
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organizationSlug={organization?.slug}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const DeletedRecordsPage = (props: DeletedRecordsPageProps) => (
  <Suspense fallback={<DeletedRecords loading />}>
    <DeletedRecordsContent {...props} />
  </Suspense>
);

export default DeletedRecordsPage;
