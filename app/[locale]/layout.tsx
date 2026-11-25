// https://nextjs.org/docs/app/guides/internationalization
// https://mui.com/material-ui/customization/css-theme-variables/configuration/#next-js-app-router

import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Sans_TC,
} from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import "./globals.css";

import AppProviders from "@/components/AppProviders";

import { LocaleEnum } from "@/enums/Locale";

import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import { buildOpenGraph, buildTwitter } from "@/utils/metadata";
import { getSiteMeta } from "@/utils/siteMeta";

// Cache Components: routes read request-time data (session cookies, searchParams)
// outside <Suspense>, so the app opts out of the static shell and renders as
// blocking routes until it adopts streaming.
// https://nextjs.org/docs/messages/blocking-prerender-dynamic
export const instant = false;

// https://nextjs.org/docs/app/api-reference/components/font#preloading
const notoSansTC = Noto_Sans_TC({
  preload: false,
  variable: "--font-brand",
});

const notoSansJP = Noto_Sans_JP({
  preload: false,
  variable: "--font-brand",
});

const notoSansKR = Noto_Sans_KR({
  preload: false,
  variable: "--font-brand",
});

const notoSansSC = Noto_Sans_SC({
  preload: false,
  variable: "--font-brand",
});

const brandFonts: Record<Locale, typeof notoSansTC> = {
  [LocaleEnum.ZhTW]: notoSansTC,
  [LocaleEnum.En]: notoSansTC,
  [LocaleEnum.Ja]: notoSansJP,
  [LocaleEnum.Ko]: notoSansKR,
  [LocaleEnum.ZhCN]: notoSansSC,
};

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const tMetadata = await getTranslations({ locale, namespace: "metadata" });

  const description = tMetadata("description");
  const siteName = tMetadata("siteName");
  const title = tMetadata("home.title");

  return {
    description,
    metadataBase: new URL(getSiteMeta().siteUrl),
    openGraph: buildOpenGraph({ description, locale, title }),
    robots: { follow: false, index: false },
    title: { default: title, template: `%s | ${siteName}` },
    twitter: buildTwitter({ description, title }),
  };
};

export const generateStaticParams = async () =>
  routing.locales.map((locale) => ({ locale }));

const RootLayout = async ({ children }: LayoutProps<"/[locale]">) => {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      className={`${brandFonts[locale].variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      lang={locale}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <InitColorSchemeScript attribute="class" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
};

export default RootLayout;
