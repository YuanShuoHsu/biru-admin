import { NextIntlClientProvider } from "next-intl";

import AppClientProviders from "./AppClientProviders";

import { defaultOrganizationSlugKey } from "@/utils/organizations";
import { getDefaultOrganizationSlug, getSession } from "@/utils/session";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => {
  const fallback = {
    [defaultOrganizationSlugKey]: getDefaultOrganizationSlug(),
  };

  return (
    <NextIntlClientProvider>
      <AppClientProviders fallback={fallback} sessionPromise={getSession()}>
        {children}
      </AppClientProviders>
    </NextIntlClientProvider>
  );
};

export default AppProviders;
