import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import KolCopy from ".";

import type { Locale } from "@/i18n/routing";

interface QuantCopyPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ code?: string }>;
}

export const generateMetadata = async ({
  params,
}: QuantCopyPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tQuant = await getTranslations({ locale, namespace: "quant" });

  return { title: tQuant("copy.label") };
};

const QuantCopyPage = async ({ searchParams }: QuantCopyPageProps) => {
  const { code } = await searchParams;

  return <KolCopy shareCode={code?.trim() ?? ""} />;
};

export default QuantCopyPage;
