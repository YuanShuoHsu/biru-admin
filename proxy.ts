// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://nextjs.org/docs/app/building-your-application/routing/internationalization
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

// https://next-intl.dev/docs/getting-started/app-router
// https://next-intl.dev/docs/routing/middleware

import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DEFAULT_AUTHENTICATED_ROUTE,
  NO_ADMIN_ACCESS_ROUTE,
} from "./constants/route";

import { routing } from "./i18n/routing";

import { authClient } from "./lib/auth-client";

const handleI18nRouting = createMiddleware(routing);

const fetchWithCookies = (url: string, request: NextRequest) =>
  fetch(url, {
    headers: {
      cookie: request.headers.get("cookie") || "",
      "X-Forwarded-For": request.headers.get("X-Forwarded-For") || "",
    },
  });

const isOrganizationMember = async (request: NextRequest) => {
  const baseURL = process.env.NEXT_PUBLIC_NEST_URL;

  try {
    const organizations = await fetchWithCookies(
      `${baseURL}/api/auth/organization/list`,
      request,
    ).then((res) => (res.ok ? res.json() : null));

    return Array.isArray(organizations) && organizations.length > 0;
  } catch {
    return false;
  }
};

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const pathnameLocale = routing.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  const locale = pathnameLocale || routing.defaultLocale;

  const response = handleI18nRouting(request);

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === "true";
  const isMaintenancePath =
    pathnameLocale && pathname === `/${pathnameLocale}/maintenance`;

  if (isMaintenanceMode) {
    if (isMaintenancePath) return response;

    return NextResponse.redirect(
      new URL(`/${locale}/maintenance`, request.url),
    );
  }

  if (isMaintenancePath)
    return NextResponse.redirect(new URL(`/${locale}`, request.url));

  const isRootPage = pathname === `/${locale}`;
  const isAuthPage = pathname.startsWith(`/${locale}/auth/`);
  const isAccountPage = [
    `/${locale}/auth/coupons`,
    `/${locale}/auth/orders`,
    `/${locale}/auth/points`,
    `/${locale}/auth/settings`,
  ].some((prefix) => pathname.startsWith(prefix));
  const isCompanyPage = pathname.startsWith(`/${locale}/company`);
  const isPublicPage = (isAuthPage && !isAccountPage) || isCompanyPage;

  const needsAdminAccess = !isPublicPage && !isAccountPage;

  const redirectWithReturn = (route: string) => {
    const redirectTo =
      pathname.slice(`/${locale}`.length) + request.nextUrl.search;
    const url = new URL(`/${locale}${route}`, request.url);
    if (redirectTo) url.searchParams.set("redirectTo", redirectTo);

    return NextResponse.redirect(url);
  };

  const [{ data: session }, isMember] = await Promise.all([
    authClient.getSession({ fetchOptions: { headers: request.headers } }),
    needsAdminAccess ? isOrganizationMember(request) : false,
  ]);

  if (!session && !isPublicPage) return redirectWithReturn("/auth/sign-in");

  if (session && isRootPage) {
    return NextResponse.redirect(
      new URL(`/${locale}${DEFAULT_AUTHENTICATED_ROUTE}`, request.url),
    );
  }

  if (session && needsAdminAccess) {
    const canAccessAdmin = session.user.role === "admin" || isMember;

    if (!canAccessAdmin) return redirectWithReturn(NO_ADMIN_ACCESS_ROUTE);
  }

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
