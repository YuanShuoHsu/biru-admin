// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import CashDeviceEvents from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type {
  CashDevice,
  CashDeviceEventListResponse,
} from "@/types/cashDevices";
import type { Organization } from "@/types/organizations";

import { getGridSearchParams, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  type FetchResult,
  fetcher,
  isMissingResource,
  settle,
} from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

interface CashDeviceEventsPageProps {
  params: Promise<{ cashDeviceId: string; locale: Locale }>;
  searchParams: Promise<{
    organization?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: CashDeviceEventsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tCashDevices = await getTranslations({
    locale,
    namespace: "cashDevices",
  });

  return { title: tCashDevices("events.label") };
};

interface CashDeviceEventsContentProps {
  canCollect: boolean;
  canRefill: boolean;
  cashDevice: CashDevice;
  events: Promise<FetchResult<CashDeviceEventListResponse>>;
  organization: Organization;
  page: number;
  pageSize: number;
}

const CashDeviceEventsContent = async ({
  events: eventsResult,
  ...props
}: CashDeviceEventsContentProps) => {
  const { data: events, error: eventsError } = await eventsResult;
  if (eventsError) return <ErrorAlert />;

  return (
    <CashDeviceEvents
      {...props}
      key={props.organization.slug}
      rowCount={events.total}
      rows={events.data}
    />
  );
};

const CashDeviceEventsPage = async ({
  params,
  searchParams,
}: CashDeviceEventsPageProps) => {
  const [cookieStore, { cashDeviceId, locale }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };

  const organization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
  );
  if (!organization) notFound();

  const { page, pageSize, redirectParams } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: [],
    filterFields: [],
    filterOperators: [],
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/cash-devices/${cashDeviceId}?${redirectParams.toString()}`,
      locale,
    });

  const memberRole = await getMemberRole(organization.id);

  if (!hasRolePermission(memberRole, { cashDevice: ["read"] })) notFound();

  const devicePath = `/api/organizations/${organization.slug}/cash-devices/${cashDeviceId}`;

  const { data: cashDevice, error: cashDeviceError } = await settle(
    fetcher<CashDevice>(devicePath, fetchOptions),
  );
  if (isMissingResource(cashDeviceError)) notFound();
  if (cashDeviceError) return <ErrorAlert />;

  const events = settle(
    fetcher<CashDeviceEventListResponse>(
      `${devicePath}/events?${getGridSearchParams({ page, pageSize }).toString()}`,
      fetchOptions,
    ),
  );

  return (
    <Suspense fallback={<CashDeviceEvents loading />}>
      <CashDeviceEventsContent
        canCollect={hasRolePermission(memberRole, {
          cashDevice: ["collection"],
        })}
        canRefill={hasRolePermission(memberRole, { cashDevice: ["refill"] })}
        cashDevice={cashDevice}
        events={events}
        organization={organization}
        page={page}
        pageSize={pageSize}
      />
    </Suspense>
  );
};

export default CashDeviceEventsPage;
