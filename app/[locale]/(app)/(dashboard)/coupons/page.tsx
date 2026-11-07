// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Coupons from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  couponFilterFieldValues,
  couponSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type { CouponFilterField, CouponSortField } from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization, OrganizationResponse } from "@/types/organizations";

import { getCoupons } from "@/utils/coupons";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getCouponEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getOrganizations, hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

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
  const tCoupons = await getTranslations({ locale, namespace: "coupons" });

  return { title: tCoupons("label") };
};

interface CouponsContentProps {
  canGrantCoupon: boolean;
  canViewAuditLog: boolean;
  fetchOptions: { headers: { cookie: string } };
  filterField?: CouponFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  isAdmin: boolean;
  locale: Locale;
  organization?: Organization;
  organizations: Promise<FetchResult<OrganizationResponse[]>>;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: CouponSortField;
  sortDirection?: SortDirection;
}

const CouponsContent = async ({
  fetchOptions,
  isAdmin,
  locale,
  organizations: organizationsResult,
  ...props
}: CouponsContentProps) => {
  const {
    filterField,
    filterOperator,
    filterValue,
    organization: selectedOrganization,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  } = props;

  const { data: organizations, error: organizationsError } =
    await organizationsResult;
  if (organizationsError) return <ErrorAlert />;

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getCouponEnumOptions(
          await getTranslations({ locale, namespace: "coupons" }),
          await getTranslations({ locale, namespace: "common" }),
          organizations,
        ),
      )
    : [];

  const { data: coupons, error } = await settle(
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
      : Promise.resolve({ coupons: [], total: 0 }),
  );
  if (error) return <ErrorAlert />;

  const { coupons: rows, total: rowCount } = coupons;

  return (
    <Coupons
      {...props}
      key={selectedOrganization?.slug}
      organizations={organizations}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const CouponsPage = async ({ params, searchParams }: CouponsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const session = await getSession();

  const isAdmin = session?.user?.role === "admin";

  const memberOrganization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
  );

  if (!isAdmin && !memberOrganization) notFound();

  const selectedOrganization = isAdmin ? undefined : memberOrganization;

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
    sortFields: couponSortFieldValues,
    filterFields: couponFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization?.slug,
  });

  if (redirectParams)
    redirect({ href: `/coupons?${redirectParams.toString()}`, locale });

  const memberRole = memberOrganization
    ? await getMemberRole(memberOrganization.id)
    : null;

  const canGrantCoupon =
    isAdmin || hasRolePermission(memberRole, { coupon: ["create"] });

  const canViewAuditLog =
    isAdmin || hasRolePermission(memberRole, { auditLog: ["read"] });

  const organizations = settle(
    isAdmin ? getOrganizations(fetchOptions) : Promise.resolve([]),
  );

  const couponsProps = {
    canGrantCoupon,
    canViewAuditLog,
    filterField,
    filterOperator,
    filterValue,
    organization: selectedOrganization,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  };

  return (
    <Suspense fallback={<Coupons {...couponsProps} loading />}>
      <CouponsContent
        {...couponsProps}
        fetchOptions={fetchOptions}
        isAdmin={isAdmin}
        locale={locale}
        organizations={organizations}
      />
    </Suspense>
  );
};

export default CouponsPage;
