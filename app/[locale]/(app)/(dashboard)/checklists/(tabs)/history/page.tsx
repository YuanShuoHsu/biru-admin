import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ChecklistHistory from ".";
import { getChecklistRunsUrl } from "./definitions";

import ErrorAlert from "@/components/ErrorAlert";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type {
  ChecklistRunListResponse,
  ChecklistTemplate,
} from "@/types/checklists";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { fetcher, settle } from "@/utils/fetcher";
import { getResolvedAdminOrganization } from "@/utils/session";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface ChecklistHistoryPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    from?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    templateId?: string;
    to?: string;
  }>;
}

const toBusinessDate = (value?: string) =>
  value && dayjs.tz(value, STORE_TIMEZONE).format("YYYY-MM-DD") === value
    ? value
    : "";

export const generateMetadata = async ({
  params,
}: ChecklistHistoryPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tChecklists = await getTranslations({
    locale,
    namespace: "checklists",
  });

  return { title: tChecklists("history.label") };
};

const ChecklistHistoryPage = async ({
  params,
  searchParams,
}: ChecklistHistoryPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const selectedOrganization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

  const { page, pageSize, redirectParams } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: [],
    filterFields: [],
    filterOperators: [],
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/checklists/history?${redirectParams.toString()}`,
      locale,
    });

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data: templates, error: templatesError } = await settle(
    fetcher<ChecklistTemplate[]>(
      `/api/organizations/${selectedOrganization.slug}/checklists/templates`,
      fetchOptions,
    ),
  );
  if (templatesError) return <ErrorAlert />;

  const filters = {
    from: toBusinessDate(rawSearchParams.from),
    templateId:
      templates.find(({ id }) => id === rawSearchParams.templateId)?.id ?? "",
    to: toBusinessDate(rawSearchParams.to),
  };

  const { data: runs, error: runsError } = await settle(
    fetcher<ChecklistRunListResponse>(
      getChecklistRunsUrl(
        selectedOrganization.slug,
        { page: page - 1, pageSize },
        filters,
      ),
      fetchOptions,
    ),
  );
  if (runsError) return <ErrorAlert />;

  return (
    <ChecklistHistory
      filters={filters}
      key={selectedOrganization.slug}
      organizationSlug={selectedOrganization.slug}
      page={page}
      pageSize={pageSize}
      rowCount={runs.total}
      rows={runs.data}
      templates={templates}
    />
  );
};

export default ChecklistHistoryPage;
