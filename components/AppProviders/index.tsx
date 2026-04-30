import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

import AppClientProviders from "./AppClientProviders";

import { swrKeys } from "@/constants/swr";

import { authClient } from "@/lib/auth-client";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = async ({ children }: AppProvidersProps) => {
  const requestHeaders = await headers();
  const [{ data: organization }, { data: initialSession }] = await Promise.all([
    authClient.organization.getFullOrganization({
      fetchOptions: { headers: requestHeaders },
    }),
    authClient.getSession({ fetchOptions: { headers: requestHeaders } }),
  ]);
  const fallback = { [swrKeys.organization]: organization };

  return (
    <NextIntlClientProvider>
      <AppClientProviders fallback={fallback} initialSession={initialSession}>
        {children}
      </AppClientProviders>
    </NextIntlClientProvider>
  );
};

export default AppProviders;
