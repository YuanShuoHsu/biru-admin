import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CredentialSettings from ".";

import type { Locale } from "@/i18n/routing";

interface QuantSettingsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: QuantSettingsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tQuant = await getTranslations({ locale, namespace: "quant" });

  return { title: tQuant("settings.label") };
};

const QuantSettingsPage = () => <CredentialSettings />;

export default QuantSettingsPage;
