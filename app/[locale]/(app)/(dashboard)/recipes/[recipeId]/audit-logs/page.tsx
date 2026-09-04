import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface RecipeAuditLogsPageProps {
  params: Promise<{ locale: Locale; recipeId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: RecipeAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const RecipeAuditLogsPage = async ({
  params,
  searchParams,
}: RecipeAuditLogsPageProps) => {
  const [{ locale, recipeId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href={`/recipes/${recipeId}/audit-logs`}
      locale={locale}
      resource="recipe"
      resourceId={recipeId}
      searchParams={query}
    />
  );
};

export default RecipeAuditLogsPage;
