// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from "next";

import { getSiteMeta } from "@/utils/siteMeta";

export default function robots(): MetadataRoute.Robots {
  const { isBlockedHost, siteUrl } = getSiteMeta();

  if (isBlockedHost) return { rules: [{ userAgent: "*", disallow: "/" }] };

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
