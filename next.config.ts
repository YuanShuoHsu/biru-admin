// https://next-intl.dev/docs/getting-started/app-router

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/images/:path*",
        destination: `${process.env.NEXT_PUBLIC_NEST_URL}/api/images/:path*`,
      },
    ];
  },
  // https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_HOST
      ? [
          {
            protocol: "https",
            hostname: process.env.NEXT_PUBLIC_IMAGE_HOST,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
