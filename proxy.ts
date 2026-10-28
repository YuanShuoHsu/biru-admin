// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://nextjs.org/docs/app/building-your-application/routing/internationalization
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

// https://next-intl.dev/docs/getting-started/app-router
// https://next-intl.dev/docs/routing/middleware

import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { query } from "./constants/query";
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

// 查不到時回 undefined，交給頁面顯示錯誤，不要誤判成沒有權限
const isOrganizationMember = async (request: NextRequest) => {
  const baseURL = process.env.NEXT_PUBLIC_NEST_URL;

  try {
    const res = await fetchWithCookies(
      `${baseURL}/api/auth/organization/list`,
      request,
    );
    if (res.status === 401) return false;
    if (!res.ok) return undefined;

    const organizations = await res.json();

    return Array.isArray(organizations) && organizations.length > 0;
  } catch {
    return undefined;
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
  const isNoAccessPage = pathname === `/${locale}${NO_ADMIN_ACCESS_ROUTE}`;

  const needsAdminAccess = !isPublicPage && !isAccountPage;

  const redirectWithReturn = (route: string) => {
    const redirectTo =
      pathname.slice(`/${locale}`.length) + request.nextUrl.search;
    const url = new URL(`/${locale}${route}`, request.url);
    if (redirectTo) url.searchParams.set(query.redirectTo, redirectTo);

    return NextResponse.redirect(url);
  };

  const [{ data: session, error: sessionError }, isMember] = await Promise.all([
    authClient.getSession({ fetchOptions: { headers: request.headers } }),
    needsAdminAccess || isNoAccessPage ? isOrganizationMember(request) : false,
  ]);

  if (sessionError) return response;

  if (!session && !isPublicPage) return redirectWithReturn("/auth/sign-in");

  if (session && isRootPage) {
    return NextResponse.redirect(
      new URL(`/${locale}${DEFAULT_AUTHENTICATED_ROUTE}`, request.url),
    );
  }

  const isPlatformAdmin = session?.user.role === "admin";
  const canAccessAdmin = isPlatformAdmin || isMember;

  if (session && needsAdminAccess && !isPlatformAdmin && isMember === false)
    return redirectWithReturn(NO_ADMIN_ACCESS_ROUTE);

  if (session && isNoAccessPage && canAccessAdmin) {
    const redirectTo = request.nextUrl.searchParams.get(query.redirectTo);
    const route = redirectTo?.startsWith("/")
      ? redirectTo
      : DEFAULT_AUTHENTICATED_ROUTE;

    return NextResponse.redirect(new URL(`/${locale}${route}`, request.url));
  }

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
