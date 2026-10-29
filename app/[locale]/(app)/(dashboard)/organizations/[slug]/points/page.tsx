import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PointTransactions from "./PointTransactions";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  pointTransactionFilterFieldValues,
  pointTransactionSortFieldValues,
} from "@/types/api";
import type { PointAdjustmentLimit } from "@/types/points";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getPointTransactionEnumOptions } from "@/utils/enumOptions";
import { fetcher, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getOrganizationPointTransactions } from "@/utils/points";
import { getSession } from "@/utils/session";

interface OrganizationsSlugPointsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
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
}: OrganizationsSlugPointsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("points.label") };
};

const OrganizationsSlugPointsPage = async ({
  params,
  searchParams,
}: OrganizationsSlugPointsPageProps) => {
  const [cookieStore, { locale, slug }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);
  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [{ data, error }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions,
    }),
    getSession(),
  ]);

  if (error?.status === 400 || error?.status === 403) notFound();
  if (error) return <ErrorAlert />;
  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  if (!hasRolePermission(currentUserRole, { organization: ["update"] }))
    notFound();

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
    sortFields: pointTransactionSortFieldValues,
    filterFields: pointTransactionFilterFieldValues,
    filterOperators: filterOperatorValues,
  });

  if (redirectParams)
    redirect({
      href: `/organizations/${slug}/points?${redirectParams.toString()}`,
      locale,
    });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getPointTransactionEnumOptions(
          await getTranslations({ locale, namespace: "auth" }),
        ),
      )
    : [];

  const [
    { data: transactions, error: transactionsError },
    { data: adjustmentLimit, error: adjustmentLimitError },
  ] = await Promise.all([
    settle(
      getOrganizationPointTransactions(
        data.slug,
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
        fetchOptions,
      ),
    ),
    settle(
      fetcher<PointAdjustmentLimit>(
        `/api/organizations/${data.slug}/point-transactions/adjustment-limit`,
        fetchOptions,
      ),
    ),
  ]);
  if (transactionsError || adjustmentLimitError) return <ErrorAlert />;

  const { transactions: rows, total: rowCount } = transactions;

  return (
    <PointTransactions
      adjustmentEnabled={adjustmentLimit.enabled}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organizationSlug={data.slug}
      ownerOnlyAbovePoints={
        currentUserRole === "owner"
          ? null
          : adjustmentLimit.ownerOnlyAbovePoints
      }
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

export default OrganizationsSlugPointsPage;
