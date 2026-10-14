import { NextIntlClientProvider } from "next-intl";

import AppClientProviders from "./AppClientProviders";

import {
  defaultOrganizationSlugKey,
  resolveDefaultOrganizationSlug,
} from "@/utils/organizations";
import { getSession, listOrganizations } from "@/utils/session";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = async ({ children }: AppProvidersProps) => {
  const [initialSession, organizations] = await Promise.all([
    getSession(),
    listOrganizations(),
  ]);

  const fallback = {
    [defaultOrganizationSlugKey]: resolveDefaultOrganizationSlug(
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
