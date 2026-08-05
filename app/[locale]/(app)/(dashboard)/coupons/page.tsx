import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Coupons from ".";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  couponFilterFieldValues,
  couponSortFieldValues,
  filterOperatorValues,
  sortDirectionValues,
} from "@/types/api";

import { getCoupons } from "@/utils/coupons";
import { getResolvedAdminOrganization } from "@/utils/menus";
import {
  canGrantOrganizationCoupon,
  getOrganizations,
} from "@/utils/organizations";

interface CouponsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: CouponsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("coupons.label") };
};

const CouponsPage = async ({ params, searchParams }: CouponsPageProps) => {
  const [
    cookieStore,
    { locale },
    {
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      organization,
      page: rawPage,
      pageSize: rawPageSize,
      quickFilterValue,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
      ...restSearchParams
    },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  const sortBy = couponSortFieldValues.find((field) => field === rawSortBy);
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = couponFilterFieldValues.find(
    (field) => field === rawFilterField,
  );
  const filterOperator = filterOperatorValues.find(
    (operator) => operator === rawFilterOperator,
  );

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const authFetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const { data: session } = await authClient.getSession({
    fetchOptions: authFetchOptions,
  });

  const isAdmin = session?.user?.role === "admin";

  const selectedOrganization = isAdmin
    ? undefined
    : await getResolvedAdminOrganization(organization, fetchOptions);

  if (
    (!isAdmin && organization !== selectedOrganization?.slug) ||
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection ||
    !!sortBy !== !!sortDirection ||
    rawFilterField !== filterField ||
    rawFilterOperator !== filterOperator ||
    !!(filterField || filterOperator || filterValue) !==
      !!(
        filterField &&
        filterOperator &&
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator))
      )
  ) {
    const params = new URLSearchParams({
      ...restSearchParams,
      ...(selectedOrganization && { organization: selectedOrganization.slug }),
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && { filterField, filterOperator, filterValue }),
    });

    redirect({ href: `/coupons?${params.toString()}`, locale });
  }

  const canGrantCoupon = isAdmin
    ? true
    : await canGrantOrganizationCoupon(
        selectedOrganization?.id,
        authFetchOptions,
      );

  const [{ coupons, total }, organizations] = await Promise.all([
    isAdmin || selectedOrganization
      ? getCoupons(
          locale,
          {
            page,
            pageSize,
            filterField,
            filterOperator,
            filterValue,
            organizationSlug: selectedOrganization?.slug,
            quickFilterValue,
            sortBy,
            sortDirection,
          },
          fetchOptions,
        )
      : { coupons: [], total: 0 },
    isAdmin ? getOrganizations(fetchOptions) : [],
  ]);

  return (
    <Coupons
      canGrantCoupon={canGrantCoupon}
      canManageCoupon={isAdmin}
      coupons={coupons}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organization={selectedOrganization}
      organizations={organizations}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default CouponsPage;
