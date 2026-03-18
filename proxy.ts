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

const fetchWithCookies = (url: string, request: NextRequest) =>
  fetch(url, {
    headers: {
      cookie: request.headers.get("cookie") || "",
      "X-Forwarded-For": request.headers.get("X-Forwarded-For") || "",
    },
  });

const getAuthInfo = async (request: NextRequest) => {
  try {
    const [session, member] = await Promise.all([
      fetchWithCookies(
        `${process.env.NEXT_PUBLIC_NEST_URL}/api/auth/get-session`,
        request,
      ).then((res) => res.json()),
      fetchWithCookies(
        `${process.env.NEXT_PUBLIC_NEST_URL}/api/auth/organization/get-active-member-role`,
        request,
      ).then((res) => res.json()),
    ]);

    return {
      userRole: session?.user?.role,
      memberRole: member?.role,
    };
  } catch {
    return { userRole: undefined, memberRole: undefined };
  }
};

const handleI18nRouting = createMiddleware(routing);

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

  const isHomePage = pathname === `/${locale}`;
  const sessionCookie = getSessionCookie(request);

  const getSignInUrl = () => {
    const redirectTo = pathname.slice(`/${locale}`.length);
    request.nextUrl.pathname = `/${locale}`;
    if (redirectTo) request.nextUrl.searchParams.set("redirectTo", redirectTo);

    return request.nextUrl;
  };

  if (!sessionCookie && !isHomePage) {
    return NextResponse.redirect(getSignInUrl());
  }

  if (sessionCookie) {
    const { userRole, memberRole } = await getAuthInfo(request);

    if (userRole !== "admin" || !memberRole) {
      const redirectRes = NextResponse.redirect(getSignInUrl());
      redirectRes.cookies.delete("better-auth.session_token");

      return redirectRes;
    }

    if (isHomePage) {
      request.nextUrl.pathname = `/${locale}/order`;
      return NextResponse.redirect(request.nextUrl);
    }
  }

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
