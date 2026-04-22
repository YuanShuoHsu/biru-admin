// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://nextjs.org/docs/app/building-your-application/routing/internationalization
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

// https://next-intl.dev/docs/getting-started/app-router
// https://next-intl.dev/docs/routing/middleware

import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEFAULT_AUTHENTICATED_ROUTE } from "./constants/route";
import { routing } from "./i18n/routing";

const SESSION_COOKIE_NAME = "better-auth.session_token";

const handleI18nRouting = createMiddleware(routing);

const fetchWithCookies = (url: string, request: NextRequest) =>
  fetch(url, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "X-Forwarded-For": request.headers.get("X-Forwarded-For") ?? "",
    },
  });

const getAuthInfo = async (request: NextRequest) => {
  const baseURL = process.env.NEXT_PUBLIC_NEST_URL;

  try {
    const [session, member] = await Promise.all([
      fetchWithCookies(`${baseURL}/api/auth/get-session`, request).then(
        (res) => (res.ok ? res.json() : null),
      ),
      fetchWithCookies(
        `${baseURL}/api/auth/organization/get-active-member-role`,
        request,
      ).then((res) => (res.ok ? res.json() : null)),
    ]);

    return {
      userRole: session?.user?.role as string | undefined,
      memberRole: member?.role as string | undefined,
    };
  } catch {
    return { userRole: undefined, memberRole: undefined };
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

    request.nextUrl.pathname = `/${locale}/maintenance`;
    return NextResponse.redirect(request.nextUrl);
  }

  if (isMaintenancePath) {
    request.nextUrl.pathname = `/${locale}`;
    return NextResponse.redirect(request.nextUrl);
  }

  const sessionCookie = getSessionCookie(request);

  const isRootPage = pathname === `/${locale}`;
  const isAuthPage = pathname.startsWith(`/${locale}/auth/`);
  const isCompanyPage = pathname.startsWith(`/${locale}/company`);
  const isSettingsPage = pathname.includes("/auth/settings");
  const isPublicPage = (isAuthPage || isCompanyPage) && !isSettingsPage;

  const buildSignInUrl = () => {
    const redirectTo = pathname.slice(`/${locale}`.length);
    request.nextUrl.pathname = `/${locale}/auth/sign-in`;
    if (redirectTo) request.nextUrl.searchParams.set("redirectTo", redirectTo);

    return request.nextUrl;
  };

  if (!sessionCookie && !isPublicPage) {
    return NextResponse.redirect(buildSignInUrl());
  }

  if (sessionCookie && isRootPage) {
    request.nextUrl.pathname = `/${locale}${DEFAULT_AUTHENTICATED_ROUTE}`;

    return NextResponse.redirect(request.nextUrl);
  }

  if (sessionCookie && !isPublicPage) {
    const { userRole, memberRole } = await getAuthInfo(request);
    const isAuthorized = userRole === "admin" || !!memberRole;

    if (!isAuthorized) {
      const redirectRes = NextResponse.redirect(buildSignInUrl());
      redirectRes.cookies.delete(SESSION_COOKIE_NAME);

      return redirectRes;
    }
  }

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
