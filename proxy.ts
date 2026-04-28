// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://nextjs.org/docs/app/building-your-application/routing/internationalization
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

// https://next-intl.dev/docs/getting-started/app-router
// https://next-intl.dev/docs/routing/middleware

import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { query } from "./constants/query";
import { DEFAULT_AUTHENTICATED_ROUTE } from "./constants/route";

import { routing } from "./i18n/routing";

import { authClient } from "./lib/auth-client";

const SESSION_COOKIE_NAME = "better-auth.session_token";

const handleI18nRouting = createMiddleware(routing);

const fetchWithCookies = (url: string, request: NextRequest) =>
  fetch(url, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "X-Forwarded-For": request.headers.get("X-Forwarded-For") ?? "",
    },
  });

const isOrganizationMember = async (request: NextRequest) => {
  const baseURL = process.env.NEXT_PUBLIC_NEST_URL;

  try {
    const member = await fetchWithCookies(
      `${baseURL}/api/auth/organization/get-active-member-role`,
      request,
    ).then((res) => (res.ok ? res.json() : null));

    return !!member?.role;
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

    request.nextUrl.pathname = `/${locale}/maintenance`;
    return NextResponse.redirect(request.nextUrl);
  }

  if (isMaintenancePath) {
    request.nextUrl.pathname = `/${locale}`;
    return NextResponse.redirect(request.nextUrl);
  }

  const isRootPage = pathname === `/${locale}`;
  const isAuthPage = pathname.startsWith(`/${locale}/auth/`);
  const isAuthSettingsPage = pathname.startsWith(`/${locale}/auth/settings`);
  const isCompanyPage = pathname.startsWith(`/${locale}/company`);
  const isPublicPage = (isAuthPage && !isAuthSettingsPage) || isCompanyPage;

  const redirectToSignIn = () => {
    const redirectTo = pathname.slice(`/${locale}`.length);
    request.nextUrl.pathname = `/${locale}/auth/sign-in`;
    if (redirectTo) request.nextUrl.searchParams.set("redirectTo", redirectTo);

    return request.nextUrl;
  };

  const { data: session } = await authClient.getSession({
    fetchOptions: { headers: request.headers },
  });

  if (!session && !isPublicPage)
    return NextResponse.redirect(redirectToSignIn());

  if (session && isRootPage) {
    request.nextUrl.pathname = `/${locale}${DEFAULT_AUTHENTICATED_ROUTE}`;

    return NextResponse.redirect(request.nextUrl);
  }

  if (session && !isPublicPage) {
    const isAuthorized = await isOrganizationMember(request);

    if (!isAuthorized) {
      const oauthProvider = request.nextUrl.searchParams.get(query.oauth);
      const signInUrl = redirectToSignIn();
      if (oauthProvider)
        signInUrl.searchParams.set("error", "NO_ACTIVE_ORGANIZATION");

      const redirectRes = NextResponse.redirect(signInUrl);
      redirectRes.cookies.delete(SESSION_COOKIE_NAME);

      return redirectRes;
    }
  }

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
