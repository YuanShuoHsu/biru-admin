// https://nextjs.org/docs/app/guides/internationalization
// https://mui.com/material-ui/customization/css-theme-variables/configuration/#next-js-app-router

import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import "./globals.css";

import AppProviders from "@/components/AppProviders";

import { routing } from "@/i18n/routing";

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import { buildOpenGraph, buildTwitter, SITE_NAME } from "@/utils/metadata";
import { getSiteMeta } from "@/utils/siteMeta";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async ({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });

  const description = t("description");
  const title = t("home.title");

  return {
    description,
    metadataBase: new URL(getSiteMeta().siteUrl),
    openGraph: buildOpenGraph({ description, locale, title }),
    robots: { follow: false, index: false },
    title: { default: title, template: `%s | ${SITE_NAME}` },
    twitter: buildTwitter({ description, title }),
  };
};

export const generateStaticParams = async () =>
  routing.locales.map((locale) => ({ locale }));

const RootLayout = async ({ children, params }: LayoutProps<"/[locale]">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html data-scroll-behavior="smooth" lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <InitColorSchemeScript attribute="class" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
};

export default RootLayout;
