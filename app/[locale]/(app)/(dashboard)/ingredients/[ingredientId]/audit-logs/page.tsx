import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

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
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const IngredientAuditLogsPage = async ({
  params,
  searchParams,
}: IngredientAuditLogsPageProps) => {
  const [{ locale, ingredientId }, query, cookieStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
  ]);

  setRequestLocale(locale);

  const ingredient = await getIngredient(ingredientId, {
    headers: { cookie: cookieStore.toString() },
  });

  if (!ingredient) notFound();

  return (
    <AuditLogsPage
      href={`/ingredients/${ingredientId}/audit-logs`}
      ingredient={ingredient}
      locale={locale}
      resource="ingredient"
      resourceId={ingredientId}
      searchParams={query}
    />
  );
};

export default IngredientAuditLogsPage;
