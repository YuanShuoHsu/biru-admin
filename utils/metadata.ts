// https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api

import type { Metadata } from "next";

import { localeConfigs } from "@/constants/locale";

import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

import { getSiteMeta } from "./siteMeta";

export const SITE_NAME = "Biru Coffee";

const getOpenGraphLocale = (locale: Locale) =>
  `${locale.split("-")[0]}_${localeConfigs[locale].countryCode}`;

interface BuildOpenGraphOptions {
  description: string;
  locale: Locale;
  title: string;
  url?: string;
}

export const buildOpenGraph = ({
  description,
  locale,
  title,
  url,
}: BuildOpenGraphOptions): Metadata["openGraph"] => ({
  alternateLocale: routing.locales
    .filter((alternate) => alternate !== locale)
    .map(getOpenGraphLocale),
  description,
  images: {
    alt: SITE_NAME,
    height: 630,
    type: "image/jpeg",
    url: `/${locale}/opengraph-image.jpg`,
    width: 1200,
  },
  locale: getOpenGraphLocale(locale),
  siteName: SITE_NAME,
  title,
  type: "website",
  url,
});

interface BuildTwitterOptions {
  description: string;
  title: string;
}

export const buildTwitter = ({
  description,
  title,
}: BuildTwitterOptions): Metadata["twitter"] => ({
  card: "summary_large_image",
  description,
  title,
});

interface BuildMetadataOptions {
  description: string;
  locale: Locale;
  pathname: string;
  title: string;
  titleAbsolute?: boolean;
}

export const buildMetadata = ({
  description,
  locale,
  pathname,
  title,
  titleAbsolute,
}: BuildMetadataOptions): Metadata => {
  const { siteUrl } = getSiteMeta();
  const url = `${siteUrl}/${locale}${pathname}`;

  return {
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((alternate) => [
            alternate,
            `${siteUrl}/${alternate}${pathname}`,
          ]),
        ),
        "x-default": `${siteUrl}/${routing.defaultLocale}${pathname}`,
      },
    },
    description,
    openGraph: buildOpenGraph({ description, locale, title, url }),
    title: titleAbsolute ? { absolute: title } : title,
    twitter: buildTwitter({ description, title }),
  };
};
