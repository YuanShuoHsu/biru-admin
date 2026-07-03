import { setRequestLocale } from "next-intl/server";

import About from ".";

import type { Locale } from "@/i18n/routing";

import { getOrganizations } from "@/utils/organizations";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

const AboutPage = async ({ params }: AboutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  const organizations = await getOrganizations();

  return <About organizations={organizations} />;
};

export default AboutPage;
