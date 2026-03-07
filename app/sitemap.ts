// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

import { getSiteMeta } from "@/utils/siteMeta";

export default function sitemap(): MetadataRoute.Sitemap {
  const { isBlockedHost, siteUrl } = getSiteMeta();

  if (isBlockedHost) return [];

  const lastModified = new Date();
  const alternates = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${siteUrl}/${locale}`]),
  );

  return routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified,
    alternates: {
      languages: alternates,
    },
  }));
}
