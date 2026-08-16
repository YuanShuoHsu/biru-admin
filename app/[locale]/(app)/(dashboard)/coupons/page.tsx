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
import { getQuickFilterEnums } from "@/utils/dataGrid";
import { getCouponEnumOptions } from "@/utils/enumOptions";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { getOrganizations, hasRolePermission } from "@/utils/organizations";

interface CouponsPageProps {
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
      quickFilterEnums: rawQuickFilterEnums,
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

  const memberOrganization = await getResolvedAdminOrganization(
    organization,
    cookieStore.toString(),
  );

  const selectedOrganization = isAdmin ? undefined : memberOrganization;

  if (
    rawQuickFilterEnums !== undefined ||
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
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator)) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });

    redirect({ href: `/coupons?${params.toString()}`, locale });
  }

  const { data: memberRole } = memberOrganization
    ? await authClient.organization.getActiveMemberRole({
        query: { organizationId: memberOrganization.id },
        fetchOptions,
      })
    : { data: undefined };

  const canGrantCoupon =
    isAdmin || hasRolePermission(memberRole?.role, { coupon: ["create"] });

  const canViewAuditLog = hasRolePermission(memberRole?.role, {
    auditLog: ["read"],
  });

  const organizationsPromise = isAdmin
    ? getOrganizations(fetchOptions)
    : Promise.resolve([]);

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getCouponEnumOptions(
          await getTranslations({ locale, namespace: "coupons" }),
          await organizationsPromise,
        ),
      )
    : [];

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
            quickFilterEnums,
            quickFilterValue,
            sortBy,
            sortDirection,
          },
          fetchOptions,
        )
      : { coupons: [], total: 0 },
    organizationsPromise,
  ]);

  return (
    <Coupons
      canGrantCoupon={canGrantCoupon}
      canManageCoupon={isAdmin}
      canViewAuditLog={canViewAuditLog}
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
