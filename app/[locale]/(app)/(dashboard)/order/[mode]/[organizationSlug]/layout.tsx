import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import MenuSocketInitializer from "./MenuSocketInitializer";

import CartAnchorTemporaryDrawer from "@/components/CartAnchorTemporaryDrawer";

import { routing } from "@/i18n/routing";

import { MenuStoreProvider } from "@/providers/menu-store-provider";

import { getMenus } from "@/utils/menus";
import { getStores } from "@/utils/stores";

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

  const stores = await getStores();

  const store = stores.find(({ slug }) => slug === organizationSlug);
  if (!store) return notFound();

  const menus = await getMenus(organizationSlug, locale);

  return (
    <MenuStoreProvider menus={menus}>
      <MenuSocketInitializer storeId={store.id} />
      <CartAnchorTemporaryDrawer />
      {children}
    </MenuStoreProvider>
  );
};

export default OrderModeOrganizationSlugLayout;
