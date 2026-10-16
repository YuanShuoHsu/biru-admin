import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Coupons from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  couponFilterFieldValues,
  couponSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getCoupons } from "@/utils/coupons";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getCouponEnumOptions } from "@/utils/enumOptions";
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

  const canViewAuditLog = hasRolePermission(memberRole, {
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
          await getTranslations({ locale, namespace: "common" }),
          await organizationsPromise,
        ),
      )
    : [];

  const [{ coupons: rows, total: rowCount }, organizations] = await Promise.all(
    [
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
    ],
  );

  return (
    <Coupons
      canGrantCoupon={canGrantCoupon}
      canManageCoupon={isAdmin}
      canViewAuditLog={canViewAuditLog}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organization={selectedOrganization}
      organizations={organizations}
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

export default CouponsPage;
