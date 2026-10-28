import { NextIntlClientProvider } from "next-intl";

import AppClientProviders from "./AppClientProviders";

import { defaultOrganizationSlugKey } from "@/utils/organizations";
import { getDefaultOrganizationSlug, getSession } from "@/utils/session";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => {
  // AppBar、抽屜與維護頁共用這兩個值，查詢失敗時退回未登入的外框，錯誤交給頁面本身顯示
  const fallback = {
    [defaultOrganizationSlugKey]: getDefaultOrganizationSlug().catch(
      () => undefined,
    ),
  };
  const sessionPromise = getSession().catch(() => null);

  return (
    <NextIntlClientProvider>
      <AppClientProviders fallback={fallback} sessionPromise={sessionPromise}>
        {children}
      </AppClientProviders>
    </NextIntlClientProvider>
  );
};

export default AppProviders;
