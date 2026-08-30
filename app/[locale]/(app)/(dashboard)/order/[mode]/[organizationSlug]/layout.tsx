import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SWRConfig } from "swr";

import MenuSocketInitializer from "./MenuSocketInitializer";

import CartAnchorTemporaryDrawer from "@/components/CartAnchorTemporaryDrawer";

import { routing } from "@/i18n/routing";

import { MenuStoreProvider } from "@/providers/menu-store-provider";

import type { OrderMenu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { getOrganization } from "@/utils/organizations";

interface OrderModeOrganizationSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    mode: string;
    organizationSlug: string;
  }>;
}

const OrderModeOrganizationSlugLayout = async ({
  children,
  params,
}: OrderModeOrganizationSlugLayoutProps) => {
  const { locale, organizationSlug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  const initialMenu = await fetcher<OrderMenu>(
    `/api/organizations/${organization.id}/order-menu?lang=${locale}`,
  ).catch(() => null);

  const fallback = {
    [`/api/organizations/${organizationSlug}`]: organization,
  };

  return (
    <SWRConfig value={{ fallback }}>
      <MenuStoreProvider initialMenu={initialMenu}>
        <MenuSocketInitializer organizationId={organization.id} />
        <CartAnchorTemporaryDrawer />
        {children}
      </MenuStoreProvider>
    </SWRConfig>
  );
};

export default OrderModeOrganizationSlugLayout;
