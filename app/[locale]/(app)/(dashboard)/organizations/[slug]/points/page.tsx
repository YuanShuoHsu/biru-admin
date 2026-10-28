import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PointTransactions from "./PointTransactions";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  pointTransactionFilterFieldValues,
  pointTransactionSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getPointTransactionEnumOptions } from "@/utils/enumOptions";
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

  const [{ data }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions,
    }),
    getSession(),
  ]);

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

  const { transactions: rows, total: rowCount } =
    await getOrganizationPointTransactions(
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
    );

  return (
    <PointTransactions
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organizationSlug={data.slug}
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
