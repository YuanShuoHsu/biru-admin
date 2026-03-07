// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://nextjs.org/docs/app/building-your-application/routing/internationalization
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

// https://next-intl.dev/docs/getting-started/app-router
// https://next-intl.dev/docs/routing/middleware

import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const pathnameLocale = routing.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  const locale = pathnameLocale || routing.defaultLocale;

  const response = handleI18nRouting(request);

  const sessionCookie = getSessionCookie(request);

  const isAuthPage = pathname.includes("/auth");
  const isAccountPage = pathname.includes("/account");

  if (sessionCookie && isAuthPage)
    return NextResponse.redirect(
      new URL(`/${locale}/account/my-account`, request.url),
    );

  if (!sessionCookie && isAccountPage)
    return NextResponse.redirect(
      new URL(`/${locale}/auth/sign-in`, request.url),
    );

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === "true";
  const isMaintenancePath =
    pathnameLocale && pathname === `/${pathnameLocale}/maintenance`;
  if (isMaintenanceMode) {
    if (isMaintenancePath) return response;

    request.nextUrl.pathname = `/${locale}/maintenance`;
    return NextResponse.redirect(request.nextUrl);
  }
  if (isMaintenancePath) {
    request.nextUrl.pathname = `/${locale}`;
    return NextResponse.redirect(request.nextUrl);
  }

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
