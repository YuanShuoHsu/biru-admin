import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

import AppClientProviders from "./AppClientProviders";

import { authClient } from "@/lib/auth-client";

import { getStores } from "@/utils/stores";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = async ({ children }: AppProvidersProps) => {
  const [stores, { data: initialSession }] = await Promise.all([
    getStores(),
    authClient.getSession({ fetchOptions: { headers: await headers() } }),
  ]);
  const fallback = { "/api/stores": stores };

  return (
    <NextIntlClientProvider>
      <AppClientProviders fallback={fallback} initialSession={initialSession}>
        {children}
      </AppClientProviders>
    </NextIntlClientProvider>
  );
};

export default AppProviders;
