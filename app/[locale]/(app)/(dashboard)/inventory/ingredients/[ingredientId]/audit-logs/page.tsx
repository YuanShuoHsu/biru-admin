import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

import { getIngredient } from "@/utils/inventory";

interface IngredientAuditLogsPageProps {
  params: Promise<{ locale: Locale; ingredientId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: IngredientAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const IngredientAuditLogsContent = async ({
  params,
  searchParams,
}: IngredientAuditLogsPageProps) => {
  const [{ locale, ingredientId }, query, cookieStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
  ]);

  const ingredient = await getIngredient(ingredientId, {
    headers: { cookie: cookieStore.toString() },
  });

  if (!ingredient) notFound();

  return (
    <AuditLogsPage
      href={`/inventory/ingredients/${ingredientId}/audit-logs`}
      ingredient={ingredient}
      locale={locale}
      resource="ingredient"
      resourceId={ingredientId}
      searchParams={query}
    />
  );
};

const IngredientAuditLogsPage = (props: IngredientAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="ingredient" />}>
    <IngredientAuditLogsContent {...props} />
  </Suspense>
);

export default IngredientAuditLogsPage;
