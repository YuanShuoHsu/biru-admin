import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import CouponRecipients from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  couponRecipientFilterFieldValues,
  couponRecipientSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getCoupon, getCouponRecipients } from "@/utils/coupons";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getCouponRecipientEnumOptions } from "@/utils/enumOptions";

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
  const [cookieStore, { couponId, locale }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

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
