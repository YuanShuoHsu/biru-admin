import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";

import AppClientProviders from "./AppClientProviders";

import { swrKeys } from "@/constants/swr";

import { authClient } from "@/lib/auth-client";

import { resolveDefaultOrganizationSlug } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = async ({ children }: AppProvidersProps) => {
  const cookieStore = await cookies();
  const [initialSession, { data: organizations }] = await Promise.all([
    getSession(),
    authClient.organization.list({
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
  ]);

  const fallback = {
    [swrKeys.defaultOrganizationSlug]: resolveDefaultOrganizationSlug(
      initialSession?.session?.activeOrganizationId,
      organizations,
    ),
  };

  return (
    <NextIntlClientProvider>
      <AppClientProviders fallback={fallback} initialSession={initialSession}>
        {children}
      </AppClientProviders>
    </NextIntlClientProvider>
  );
};

export default AppProviders;
