import { setRequestLocale } from "next-intl/server";

import Home from ".";

import type { Locale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <Home />;
};

export default HomePage;
