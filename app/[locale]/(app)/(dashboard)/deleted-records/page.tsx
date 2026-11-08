// https://nextjs.org/docs/app/guides/streaming#status-codes

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
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  DeletedRecordBatch,
  DeletedRecordFilterField,
  DeletedRecordSortField,
} from "@/types/deletedRecords";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  canRestoreDeletedRecords,
  getDeletedRecords,
} from "@/utils/deletedRecords";
import { getDeletedRecordEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
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

interface DeletedRecordsContentProps {
  deletedRecords: Promise<
    FetchResult<{ deletedRecords: DeletedRecordBatch[]; total: number }>
  >;
  filterField?: DeletedRecordFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: DeletedRecordSortField;
  sortDirection?: SortDirection;
}

const DeletedRecordsContent = async ({
  deletedRecords: deletedRecordsResult,
  ...props
}: DeletedRecordsContentProps) => {
  const { data: deletedRecords, error } = await deletedRecordsResult;
  if (error) return <ErrorAlert />;

  const { deletedRecords: rows, total: rowCount } = deletedRecords;

  return (
    <DeletedRecords
      {...props}
      key={props.organizationSlug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const DeletedRecordsPage = async ({
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

  const deletedRecords = settle(
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

  return (
    <Suspense fallback={<DeletedRecords loading />}>
      <DeletedRecordsContent
        deletedRecords={deletedRecords}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organizationSlug={organization?.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default DeletedRecordsPage;
