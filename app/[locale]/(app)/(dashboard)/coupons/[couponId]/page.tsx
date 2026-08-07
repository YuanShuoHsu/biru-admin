import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import CouponRecipients from ".";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  couponRecipientFilterFieldValues,
  couponRecipientSortFieldValues,
  filterOperatorValues,
  sortDirectionValues,
} from "@/types/api";

import { getCoupon, getCouponRecipients } from "@/utils/coupons";

interface CouponRecipientsPageProps {
  params: Promise<{ couponId: string; locale: Locale }>;
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
}: CouponRecipientsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("coupons.recipients.label") };
};

const CouponRecipientsPage = async ({
  params,
  searchParams,
}: CouponRecipientsPageProps) => {
  const [
    cookieStore,
    { couponId, locale },
    {
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
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

  const sortBy = couponRecipientSortFieldValues.find(
    (field) => field === rawSortBy,
  );
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = couponRecipientFilterFieldValues.find(
    (field) => field === rawFilterField,
  );
  const filterOperator = filterOperatorValues.find(
    (operator) => operator === rawFilterOperator,
  );
  const quickFilterEnums = [rawQuickFilterEnums || []].flat();

  const isNoValueOperator =
    !!filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
  const hasFilter =
    !!filterField && !!filterOperator && (!!filterValue || isNoValueOperator);

  if (
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection ||
    !!sortBy !== !!sortDirection ||
    rawFilterField !== filterField ||
    rawFilterOperator !== filterOperator ||
    !!(filterField || filterOperator || filterValue) !== hasFilter
  ) {
    const params = new URLSearchParams({
      ...restSearchParams,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    for (const entry of quickFilterEnums)
      params.append("quickFilterEnums", entry);

    redirect({ href: `/coupons/${couponId}?${params.toString()}`, locale });
  }

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [coupon, { recipients, total }] = await Promise.all([
    getCoupon(couponId, fetchOptions),
    getCouponRecipients(
      couponId,
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
  ]);

  if (!coupon) notFound();

  return (
    <CouponRecipients
      couponId={couponId}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      recipients={recipients}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default CouponRecipientsPage;
