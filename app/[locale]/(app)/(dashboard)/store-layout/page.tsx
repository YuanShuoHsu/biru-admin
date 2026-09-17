import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import StoreLayout from ".";

import type { Locale } from "@/i18n/routing";

interface StoreLayoutPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: StoreLayoutPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tStoreLayout = await getTranslations({
    locale,
    namespace: "storeLayout",
  });

  return { title: tStoreLayout("label") };
};

const StoreLayoutPage = async ({ params }: StoreLayoutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <StoreLayout />;
};

export default StoreLayoutPage;
