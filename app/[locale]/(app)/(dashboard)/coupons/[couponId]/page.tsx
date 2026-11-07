// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import CouponRecipients from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  couponRecipientFilterFieldValues,
  couponRecipientSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  CouponRecipient,
  CouponRecipientFilterField,
  CouponRecipientSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getCoupon, getCouponRecipients } from "@/utils/coupons";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getCouponRecipientEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";

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
  const tCoupons = await getTranslations({ locale, namespace: "coupons" });

  return { title: tCoupons("recipients.label") };
};

interface CouponRecipientsContentProps {
  couponId: string;
  filterField?: CouponRecipientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  recipients: Promise<
    FetchResult<{ recipients: CouponRecipient[]; total: number }>
  >;
  sortBy?: CouponRecipientSortField;
  sortDirection?: SortDirection;
}

const CouponRecipientsContent = async ({
  recipients,
  ...props
}: CouponRecipientsContentProps) => {
  const { data, error } = await recipients;
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const { recipients: rows, total: rowCount } = data;

  return <CouponRecipients {...props} rowCount={rowCount} rows={rows} />;
};

const CouponRecipientsPage = async ({
  params,
  searchParams,
}: CouponRecipientsPageProps) => {
  const [cookieStore, { couponId, locale }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

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
    sortFields: couponRecipientSortFieldValues,
    filterFields: couponRecipientFilterFieldValues,
    filterOperators: filterOperatorValues,
  });

  if (redirectParams)
    redirect({
      href: `/coupons/${couponId}?${redirectParams.toString()}`,
      locale,
    });

  const tCoupons = await getTranslations({ locale, namespace: "coupons" });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getCouponRecipientEnumOptions(tCoupons),
      )
    : [];

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const recipients = settle(
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
  );

  const { error: couponError } = await settle(
    getCoupon(couponId, fetchOptions),
  );
  if (couponError?.status === 403 || couponError?.status === 404) notFound();
  if (couponError) return <ErrorAlert />;

  const couponRecipientsProps = {
    couponId,
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  };

  return (
    <Suspense
      fallback={<CouponRecipients {...couponRecipientsProps} loading />}
    >
      <CouponRecipientsContent
        {...couponRecipientsProps}
        recipients={recipients}
      />
    </Suspense>
  );
};

export default CouponRecipientsPage;
