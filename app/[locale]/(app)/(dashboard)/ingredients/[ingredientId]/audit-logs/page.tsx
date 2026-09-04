import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

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
  const [{ locale, ingredientId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href={`/ingredients/${ingredientId}/audit-logs`}
      locale={locale}
      resource="ingredient"
      resourceId={ingredientId}
      searchParams={query}
    />
  );
};

export default IngredientAuditLogsPage;
