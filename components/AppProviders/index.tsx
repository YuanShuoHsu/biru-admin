import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

import AppClientProviders from "./AppClientProviders";

import { authClient } from "@/lib/auth-client";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = async ({ children }: AppProvidersProps) => {
  const requestHeaders = await headers();
  const { data: initialSession } = await authClient.getSession({
    fetchOptions: { headers: requestHeaders },
  });

  const fallback = {};

  return (
    <NextIntlClientProvider>
      <AppClientProviders fallback={fallback} initialSession={initialSession}>
        {children}
      </AppClientProviders>
    </NextIntlClientProvider>
  );
};

export default AppProviders;
