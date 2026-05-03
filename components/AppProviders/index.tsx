import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

import AppClientProviders from "./AppClientProviders";

import { authClient } from "@/lib/auth-client";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = async ({ children }: AppProvidersProps) => {
  const requestHeaders = await headers();
  const [{ data: initialSession }, { data: organizations }] = await Promise.all(
    [
      authClient.getSession({ fetchOptions: { headers: requestHeaders } }),
      authClient.organization.list({
        fetchOptions: { headers: requestHeaders },
      }),
    ],
  );

  const defaultOrganization = (organizations || []).toReversed()[0]?.slug || "";

  const fallback = {
    "default-organization": defaultOrganization,
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
